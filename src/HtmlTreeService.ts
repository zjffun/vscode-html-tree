import * as vscode from "vscode";
import { parseFragment } from "parse5";
import { log } from "./extension";

let singletonInstance: HtmlTreeService;

export class HtmlTreeService {
  static get singleton() {
    if (!singletonInstance) {
      singletonInstance = new HtmlTreeService();
    }
    return singletonInstance;
  }

  constructor() {}

  static getAst() {
    const text = vscode.window.activeTextEditor?.document.getText();

    if (!text) {
      log.appendLine("Can't get text from active editor.");
      return [];
    }

    const ast = parseFragment(text, {
      sourceCodeLocationInfo: true,
    });

    return ast;
  }

  static getBeforeBeginPosition(node: any): vscode.Position {
    const offset = node.sourceCodeLocation.startOffset;

    const position =
      vscode.window.activeTextEditor?.document.positionAt(offset);

    if (!position) {
      throw new Error("Can't get position from active editor.");
    }

    return position;
  }

  static getAfterBeginPosition(node: any): vscode.Position {
    const offset =
      node.sourceCodeLocation?.startTag?.endOffset ||
      node.sourceCodeLocation.startOffset;

    const position =
      vscode.window.activeTextEditor?.document.positionAt(offset);

    if (!position) {
      throw new Error("Can't get position from active editor.");
    }

    return position;
  }

  static getBeforeEndPosition(node: any): vscode.Position {
    const offset =
      node.sourceCodeLocation?.endTag?.startOffset ||
      node.sourceCodeLocation.endOffset;

    const position =
      vscode.window.activeTextEditor?.document.positionAt(offset);

    if (!position) {
      throw new Error("Can't get position from active editor.");
    }

    return position;
  }

  static getAfterEndPosition(node: any): vscode.Position {
    const offset = node.sourceCodeLocation.endOffset;

    const position =
      vscode.window.activeTextEditor?.document.positionAt(offset);

    if (!position) {
      throw new Error("Can't get position from active editor.");
    }

    return position;
  }

  static getRange(node: any): vscode.Range {
    const startPosition = HtmlTreeService.getBeforeBeginPosition(node);
    const endPosition = HtmlTreeService.getAfterEndPosition(node);

    return new vscode.Range(startPosition, endPosition);
  }
}
