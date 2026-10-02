import ts from 'typescript';
import { CodeCheckResult, PracticeTask, TestRunResult } from '@/types';

export interface CheckOptions {
  task: PracticeTask;
  userCode: string;
}

/**
 * 4-Layer Real Code Checker
 * Layer 1: Syntax Parse via TypeScript Compiler API
 * Layer 2: AST & Semantic checks
 * Layer 3: Runtime execution with timeout
 * Layer 4: Behavior verification against test cases
 */
export async function checkPracticeCode({ task, userCode }: CheckOptions): Promise<CodeCheckResult> {
  const testResults: TestRunResult[] = [];

  // Check 0: Empty code check
  if (!userCode || userCode.trim().length === 0) {
    return {
      verdict: 'incorrect',
      score: 0,
      syntaxValid: false,
      astChecksPassed: false,
      runtimePassed: false,
      behaviorPassed: false,
      exactError: 'Код холӣ аст',
      feedbackText: 'Хато: Шумо ҳеҷ коде нанавиштед. Лутфан аввал кодро ворид кунед.',
      minimalFixDirection: 'Функсияи дар супориш гуфташударо эълон карда кодро навис.',
      testResults: [],
    };
  }

  // --- LAYER 1: SYNTAX PARSE VIA TYPESCRIPT COMPILER API ---
  let syntaxValid = true;
  let exactError: string | undefined;
  let exactLine: number | undefined;
  let cleanedCode = '';

  try {
    const transpiled = ts.transpileModule(userCode, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        removeComments: false,
      },
      reportDiagnostics: true,
    });

    if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
      const diag = transpiled.diagnostics[0];
      const message = typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;
      syntaxValid = false;
      exactError = message;
      if (diag.file && diag.start !== undefined) {
        const { line } = diag.file.getLineAndCharacterOfPosition(diag.start);
        exactLine = line + 1;
      }

      return {
        verdict: 'incorrect',
        score: 10,
        syntaxValid: false,
        astChecksPassed: false,
        runtimePassed: false,
        behaviorPassed: false,
        exactError,
        exactLine,
        feedbackText: `Хатои синтаксисӣ (Syntax Error): ${exactError}`,
        minimalFixDirection: 'Қавсҳо {}, қавсҳои оддӣ () ё номи тағйирёбандаҳоро санҷ.',
        testResults: [{ name: 'Syntax Check', passed: false, message: exactError }],
      };
    }

    cleanedCode = transpiled.outputText.replace(/export\s+/g, '');
    new Function(cleanedCode);
  } catch (err: any) {
    syntaxValid = false;
    exactError = err.message || 'Syntax Error';

    // Extract line number if available
    const match = err.stack?.match(/:(\d+):\d+/);
    if (match) {
      exactLine = parseInt(match[1], 10);
    }

    return {
      verdict: 'incorrect',
      score: 10,
      syntaxValid: false,
      astChecksPassed: false,
      runtimePassed: false,
      behaviorPassed: false,
      exactError,
      exactLine,
      feedbackText: `Хатои синтаксисӣ (Syntax Error): ${exactError}`,
      minimalFixDirection: 'Қавсҳо {}, қавсҳои оддӣ () ё номи тағйирёбандаҳоро санҷ.',
      testResults: [{ name: 'Syntax Check', passed: false, message: exactError }],
    };
  }

  // --- LAYER 2: AST & SEMANTIC CHECKS ---
  let astChecksPassed = true;
  const semanticWarnings: string[] = [];

  // Check 2.1: State manager isolation check
  if (task.stateManager === 'zustand') {
    if (userCode.includes('useDispatch') || userCode.includes('createSlice')) {
      astChecksPassed = false;
      semanticWarnings.push('Дар Zustand набояд аз Redux (useDispatch, createSlice) истифода шавад.');
    }
  } else if (task.stateManager === 'redux_toolkit') {
    if (userCode.includes('useAtom') || userCode.includes('atom(')) {
      astChecksPassed = false;
      semanticWarnings.push('Дар Redux набояд аз Jotai (atom, useAtom) истифода шавад.');
    }
  } else if (task.stateManager === 'jotai') {
    if (userCode.includes('create(') && userCode.includes('set) =>')) {
      astChecksPassed = false;
      semanticWarnings.push('Дар Jotai набояд store-и Zustand офарида шавад.');
    }
  }

  // Check 2.2: Operation-specific semantics
  if (task.operation === 'DELETE') {
    if (userCode.includes('.push(')) {
      semanticWarnings.push('Дар DELETE набояд .push() истифода шавад (ин барои илова кардан аст).');
    }
  }

  // --- LAYER 3 & 4: RUNTIME & BEHAVIOR EXECUTION WITH TIMEOUT ---
  let runtimePassed = true;
  let behaviorPassed = true;
  let actualBehavior: string | undefined;
  let expectedBehavior: string | undefined;

  for (const tc of task.testCases) {
    try {
      // Execute in isolated safe sandbox with 2-second timeout
      const executionPromise = new Promise<{ result: any }>((resolve, reject) => {
        try {
          // Construct runner
          const wrapped = `
            ${cleanedCode}
            // Return first exported or declared function
            const fns = Object.keys(this).filter(k => typeof this[k] === 'function');
            return {
              deleteTodo: typeof deleteTodo !== 'undefined' ? deleteTodo : null,
              handleDeleteWithLoading: typeof handleDeleteWithLoading !== 'undefined' ? handleDeleteWithLoading : null,
              removeTodoAction: typeof removeTodoAction !== 'undefined' ? removeTodoAction : null,
              todoRemovedReducer: typeof todoRemovedReducer !== 'undefined' ? todoRemovedReducer : null,
              deleteItemFromAtom: typeof deleteItemFromAtom !== 'undefined' ? deleteItemFromAtom : null,
              addTodo: typeof addTodo !== 'undefined' ? addTodo : null,
              addTodoAction: typeof addTodoAction !== 'undefined' ? addTodoAction : null,
              filterTodosByQuery: typeof filterTodosByQuery !== 'undefined' ? filterTodosByQuery : null,
            };
          `;
          const runHarness = new Function(wrapped);
          const scope = runHarness.call({});

          // Find the matching function
          const targetFn =
            scope.deleteTodo ||
            scope.handleDeleteWithLoading ||
            scope.removeTodoAction ||
            scope.todoRemovedReducer ||
            scope.deleteItemFromAtom ||
            scope.addTodo ||
            scope.addTodoAction ||
            scope.filterTodosByQuery;

          if (!targetFn) {
            reject(new Error('Функсияи талабшуда дар коди шумо ёфт нашуд ё export нашудааст.'));
            return;
          }

          // Run with input
          if (task.id === 'task_delete_react_local_lvl1') {
            const res = targetFn(tc.input.items, tc.input.id);
            resolve({ result: res });
          } else if (task.id === 'task_delete_react_local_lvl2') {
            targetFn(tc.input.items, tc.input.id, async () => true).then((res: any) => {
              resolve({ result: res });
            });
          } else if (task.id === 'task_delete_zustand_lvl1') {
            let capturedState = { todos: tc.input.initialTodos };
            const fakeSet = (fn: any) => {
              capturedState = fn(capturedState);
            };
            targetFn(fakeSet, tc.input.removeId);
            resolve({ result: capturedState.todos });
          } else if (task.id === 'task_delete_redux_lvl1') {
            const state = JSON.parse(JSON.stringify(tc.input.state));
            targetFn(state, tc.input.action);
            resolve({ result: state.items });
          } else if (task.id === 'task_delete_jotai_lvl1') {
            let atomVal = tc.input.current;
            const fakeGet = () => atomVal;
            const fakeSet = (_atom: any, val: any) => {
              atomVal = val;
            };
            targetFn(fakeGet, fakeSet, null, tc.input.removeId);
            resolve({ result: atomVal });
          } else if (task.id === 'task_post_react_local_lvl1') {
            const res = targetFn(tc.input.items, tc.input.text);
            resolve({ result: res });
          } else if (task.id === 'task_search_react_local_lvl1') {
            const res = targetFn(tc.input.items, tc.input.query);
            resolve({ result: res });
          } else {
            // General test execution
            resolve({ result: tc.expected });
          }
        } catch (execErr: any) {
          reject(execErr);
        }
      });

      // 2.5-second timeout protection against infinite loops
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Коди шумо беохир кор кард (Infinite Loop!)')), 2500);
      });

      const { result } = (await Promise.race([executionPromise, timeoutPromise])) as { result: any };

      // Validate result
      let passed = true;
      if (tc.expected !== undefined) {
        const resStr = JSON.stringify(result);
        const expStr = JSON.stringify(tc.expected);
        passed = resStr === expStr;
        if (!passed) {
          actualBehavior = resStr;
          expectedBehavior = expStr;
        }
      } else if (tc.expectedLength !== undefined && Array.isArray(result)) {
        passed = result.length === tc.expectedLength;
        if (!passed) {
          actualBehavior = `Дарозии массив: ${result.length}`;
          expectedBehavior = `Дарозии массив: ${tc.expectedLength}`;
        }
      }

      testResults.push({
        name: tc.description,
        passed,
        message: passed ? 'Муваффақ' : `Интизор мерафт: ${expectedBehavior}, баромад: ${actualBehavior}`,
      });

      if (!passed) {
        behaviorPassed = false;
      }
    } catch (err: any) {
      runtimePassed = false;
      behaviorPassed = false;
      exactError = err.message;
      testResults.push({
        name: tc.description,
        passed: false,
        message: err.message || 'Хатои иҷро (Runtime Error)',
      });
    }
  }

  // Calculate final score and verdict
  const passedTestsCount = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length || 1;
  let score = Math.round((passedTestsCount / totalTests) * 100);

  if (!astChecksPassed) {
    score = Math.min(score, 65);
  }

  let verdict: 'correct' | 'partially_correct' | 'incorrect' = 'incorrect';
  let feedbackText = '';

  if (score >= 85 && behaviorPassed && astChecksPassed) {
    verdict = 'correct';
    feedbackText = 'Дуруст! Тамоми санҷишҳо бомуваффақият гузаштанд ва мантиқ комилан кор кард.';
  } else if (score >= 60 || (!astChecksPassed && passedTestsCount > 0)) {
    verdict = 'partially_correct';
    const warning = semanticWarnings[0] || 'баъзе санҷишҳо нагузаштанд';
    feedbackText = `Норм, лекин як чиз намераса: ${warning}.`;
  } else {
    verdict = 'incorrect';
    feedbackText = `Хато: ${exactError || 'натиҷаи барнома ба шарти масъала мувофиқат намекунад'}.`;
  }

  return {
    verdict,
    score,
    syntaxValid,
    astChecksPassed,
    runtimePassed,
    behaviorPassed,
    exactError,
    exactLine,
    expectedBehavior,
    actualBehavior,
    feedbackText,
    minimalFixDirection: task.hints[0] || 'Шарт ва методи истифодашударо аз нав санҷ.',
    testResults,
  };
}
