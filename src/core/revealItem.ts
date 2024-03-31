import * as vscode from "vscode";
import HtmlTreeView from "../views/HtmlTreeView";

export default async function revealItem() {
  if (!HtmlTreeView.singleton.treeView.visible) {
    return;
  }

  const selection = vscode.window.activeTextEditor?.selection;
  if (!selection) {
    return;
  }

  const offset = vscode.window.activeTextEditor?.document.offsetAt(
    selection.active
  );
  if (!offset) {
    return;
  }

  await HtmlTreeView.singleton.revealItem(offset);
  return true;
}
