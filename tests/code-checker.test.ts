import { describe, it, expect } from 'vitest';
import { checkPracticeCode } from '@/lib/grading/code-checker';
import { PRACTICE_TASKS } from '@/content/practice-tasks';

describe('Real 4-Layer Code Checker', () => {
  const deleteLocalTask = PRACTICE_TASKS.find((t) => t.id === 'task_delete_react_local_lvl1')!;

  it('marks exact correct code as correct with score 100', async () => {
    const correctCode = `
      export function deleteTodo(items: { id: number; text: string }[], id: number) {
        return items.filter(item => item.id !== id);
      }
    `;

    const result = await checkPracticeCode({
      task: deleteLocalTask,
      userCode: correctCode,
    });

    expect(result.syntaxValid).toBe(true);
    expect(result.behaviorPassed).toBe(true);
    expect(result.verdict).toBe('correct');
    expect(result.score).toBe(100);
  });

  it('detects syntax errors with error message', async () => {
    const brokenCode = `
      export function deleteTodo(items, id) {
        return items.filter(item => item.id !== id; // missing paren
      }
    `;

    const result = await checkPracticeCode({
      task: deleteLocalTask,
      userCode: brokenCode,
    });

    expect(result.syntaxValid).toBe(false);
    expect(result.verdict).toBe('incorrect');
    expect(result.exactError).toBeDefined();
  });

  it('detects runtime / behavior mismatch when wrong logic is returned', async () => {
    const wrongLogicCode = `
      export function deleteTodo(items, id) {
        // Return unfiltered items
        return items;
      }
    `;

    const result = await checkPracticeCode({
      task: deleteLocalTask,
      userCode: wrongLogicCode,
    });

    expect(result.syntaxValid).toBe(true);
    expect(result.behaviorPassed).toBe(false);
    expect(result.verdict).toBe('incorrect');
  });

  it('handles empty code safely without throwing', async () => {
    const result = await checkPracticeCode({
      task: deleteLocalTask,
      userCode: '',
    });

    expect(result.verdict).toBe('incorrect');
    expect(result.score).toBe(0);
  });
});
