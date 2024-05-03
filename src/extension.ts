import * as vscode from "vscode";
import { throttle } from "lodash";
import { HtmlTreeService } from "./HtmlTreeService";
import { setContext, textNodeNames } from "./share";
import HtmlTreeView from "./views/HtmlTreeView";
import insert from "./core/insert";
import revealItem from "./core/revealItem";

export const log = vscode.window.createOutputChannel("HTML Tree");

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  const throttledRefresh = throttle(
    () => {
      HtmlTreeView.singleton.refresh();
    },
    1000,
    {
      leading: false,
      trailing: true,
    }
  );

  const throttledRevealItem = throttle(revealItem, 100, {
    leading: false,
    trailing: true,
  });

  new HtmlTreeView(context);

  vscode.window.onDidChangeActiveTextEditor(throttledRefresh);

  vscode.window.onDidChangeTextEditorSelection(throttledRevealItem);

  vscode.workspace.onDidChangeTextDocument(throttledRefresh);

  context.subscriptions.push(
    vscode.commands.registerCommand("html-tree.select", async (item) => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const activeTextDocument = activeTextEditor?.document;
      if (!activeTextDocument) {
        return;
      }

      const range = HtmlTreeService.getRange(item.node);

      activeTextEditor.selection = new vscode.Selection(range.start, range.end);

      activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);

      vscode.window.showTextDocument(activeTextDocument);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("html-tree.rename", async (item) => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const activeTextDocument = activeTextEditor?.document;
      if (!activeTextDocument) {
        return;
      }

      const beforeBeginPosition = HtmlTreeService.getBeforeBeginPosition(
        item.node
      );
      const position = beforeBeginPosition.with({
        character: beforeBeginPosition.character + 1,
      });

      activeTextEditor.selection = new vscode.Selection(position, position);

      activeTextEditor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );

      await vscode.commands.executeCommand("editor.emmet.action.updateTag");

      HtmlTreeView.singleton.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("html-tree.delete", async (item) => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const activeTextDocument = activeTextEditor?.document;
      if (!activeTextDocument) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();

      if (textNodeNames.includes(item.node.nodeName)) {
        const range = HtmlTreeService.getRange(item.node);
        workspaceEdit.delete(activeTextDocument.uri, range);
      } else {
        const beforeBeginPosition = HtmlTreeService.getBeforeBeginPosition(
          item.node
        );
        const afterBeginPosition = HtmlTreeService.getAfterBeginPosition(
          item.node
        );
        const beforeEndPosition = HtmlTreeService.getBeforeEndPosition(
          item.node
        );
        const afterEndPosition = HtmlTreeService.getAfterEndPosition(item.node);

        workspaceEdit.delete(
          activeTextDocument.uri,
          new vscode.Range(beforeBeginPosition, afterBeginPosition)
        );

        workspaceEdit.delete(
          activeTextDocument.uri,
          new vscode.Range(beforeEndPosition, afterEndPosition)
        );
      }

      const applyEditResult = await vscode.workspace.applyEdit(workspaceEdit);

      if (!applyEditResult) {
        return;
      }

      HtmlTreeView.singleton.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("html-tree.wrap", async (item) => {
      await vscode.commands.executeCommand("html-tree.select", item);
      await vscode.commands.executeCommand(
        "editor.emmet.action.wrapWithAbbreviation"
      );
      HtmlTreeView.singleton.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "html-tree.insertBeforeBegin",
      async (item) => {
        const position = HtmlTreeService.getBeforeBeginPosition(item.node);
        await insert(position);
        HtmlTreeView.singleton.refresh();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "html-tree.insertAfterBegin",
      async (item) => {
        const position = HtmlTreeService.getAfterBeginPosition(item.node);
        await insert(position);
        HtmlTreeView.singleton.refresh();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "html-tree.insertBeforeEnd",
      async (item) => {
        const position = HtmlTreeService.getBeforeEndPosition(item.node);
        await insert(position);
        HtmlTreeView.singleton.refresh();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "html-tree.insertAfterEnd",
      async (item) => {
        const position = HtmlTreeService.getAfterEndPosition(item.node);
        await insert(position);
        HtmlTreeView.singleton.refresh();
      }
    )
  );
}

export function deactivate() {}
