import * as vscode from "vscode";

export default async function insert(position: vscode.Position) {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const activeTextDocument = activeTextEditor?.document;
  if (!activeTextDocument) {
    return;
  }

  activeTextEditor.selection = new vscode.Selection(position, position);

  activeTextEditor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenter
  );

  const workspaceEdit = new vscode.WorkspaceEdit();

  workspaceEdit.insert(activeTextDocument.uri, position, "  ");

  const applyEditResult = await vscode.workspace.applyEdit(workspaceEdit);
  if (!applyEditResult) {
    return;
  }

  activeTextEditor.selection = new vscode.Selection(
    position,
    position.with({ character: position.character + 1 })
  );

  const wrapResult = await vscode.commands.executeCommand(
    "editor.emmet.action.wrapWithAbbreviation"
  );
  if (!wrapResult) {
    return;
  }

  await vscode.commands.executeCommand("editor.emmet.action.goToMatchingPair");

  return true;
}
