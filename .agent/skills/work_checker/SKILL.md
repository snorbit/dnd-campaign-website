---
name: work_checker
description: Audits work completed in the session for errors, inconsistencies, and alignment with requirements.
---

# Work Checker Skill

This skill is designed to perform a comprehensive audit of the work performed during a development session. It ensures that the implementation matches the requirements, follows project conventions, and is free of common errors or inconsistencies.

## When to Use
- After completing a major feature or task.
- Before submitting a pull request or finishing a branch.
- When you suspect something might have been missed or implemented incorrectly.

## Audit Workflow

### 1. Identify Requirements
- Locate the original task description (e.g., in `CONTRIBUTING.md`, `Dads_To_Do.md`, or previous user messages).
- List all specific requirements, acceptance criteria, and constraints.

### 2. Identify Modified Files
- Use tools like `git diff` or review the conversation history to identify every file that was created or modified.
- Categorize the changes: Components, Hooks, Types, Contexts, Utils, etc.

### 3. Verify Implementation against Requirements
- Match each modification to a specific requirement.
- Check for **Missing Logic**: Are all edge cases handled?
- Check for **Deviations**: Did the implementation diverge from the planned approach without justification?

### 4. Check for Inconsistencies
- **Naming Conventions**: Are variable, function, and component names consistent with the project style?
- **Data Flow**: Is state management handled consistently? (e.g., using `CampaignContext` vs local state).
- **Types**: Ensure interfaces and types match across files. Check `types.ts` for consistency.
- **Patterns**: If a standard pattern was established (like the `useRealtimeSubscription` hook), ensure it's used everywhere it should be.

### 5. Architectural Integrity
- Ensure no circular dependencies are introduced.
- Verify that logic is placed in the correct layer (e.g., database logic in hooks/context, UI logic in components).
- Check for redundant code or duplicated logic that should be refactored.

### 6. Error Handling & Edge Cases
- Verify that API calls (Supabase) have proper error handling and loading states.
- Check for potential null pointer errors in complex data structures (especially JSON blobs from the database).

## Report Format

When this skill is invoked, it should produce a report with the following sections:

1. **Summary of Work Audited**: Briefly list the tasks and files covered.
2. **Requirement Match**: A checklist of requirements and their implementation status.
3. **Inconsistencies Found**: List any naming, typing, or pattern mismatches.
4. **Potential Errors**: Highlight any logic gaps or bug risks.
5. **Architectural Feedback**: Suggestions for improvement or refactoring.
6. **Verdict**: (PASS / PASS WITH MINIMAL ISSUES / FAIL)

## Example Script (Internal Rationale)
To help with identifying changes, use:
```powershell
# In Windows Powershell
git status --short
```
Or review the tool call history to see `write_to_file` and `replace_file_content` calls.
