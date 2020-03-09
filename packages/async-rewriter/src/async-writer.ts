/* eslint no-console:0 */
import { ECMAScriptVisitor } from './antlr/ECMAScriptVisitor';
enum UnknownType {
  type = 'Unknown'
}

export default class AsyncWriter extends ECMAScriptVisitor {
  public visit: any;
  private inputStream: any;
  private commonTokenStream: any;
  readonly Types: any;
  readonly Symbols: any;
  constructor(chars, tokens, shellTypes, symbols) {
    super();
    this.inputStream = chars;
    this.commonTokenStream = tokens;
    this.Types = shellTypes;
    this.Symbols = symbols;
  }

  visitChildren(ctx): string {
    return ctx.children.reduce((str, node) => {
      return `${str}${this.visit(node)}`;
    }, '').trim();
  }
  visitEof(): string {
    return '';
  }
  visitEos(ctx): string {
    // eslint-disable-next-line new-cap
    if (ctx.SemiColon()) {
      return ';\n';
    }

    // eslint-disable-next-line new-cap
    if (ctx.EOF()) {
      return '\n';
    }
    return '';
  }
  visitTerminal(ctx): string {
    if (this.commonTokenStream.tokens.length > ctx.symbol.tokenIndex + 1) { // lookahead
      const lookahead = this.commonTokenStream.tokens[ctx.symbol.tokenIndex + 1];
      if (lookahead.channel === 1) {
        return `${ctx.getText()}${this.inputStream.getText(lookahead.start, lookahead.stop)}`;
      }
    }
    return ctx.getText();
  }
  _getType(ctx): any {
    if (ctx.type !== undefined) {
      return ctx;
    }
    if (!ctx.children) {
      ctx.type = UnknownType;
      return ctx;
    }
    for (const c of ctx.children) {
      const typed = this._getType(c);
      if (typed) {
        return typed;
      }
    }
  }

  visitReturnStatement(ctx): string {
    if (!ctx.expressionSequence()) {
      return this.visitChildren(ctx);
    }
    const result = this.visit(ctx.expressionSequence());
    ctx.type = this._getType(ctx.expressionSequence());
    return `return ${result};\n`;
  }

  visitFuncDefExpression(ctx): string {
    this.Symbols.pushScope();
    this.visit(ctx.functionBody());
    const bodyResult = this._getType(ctx.functionBody());
    this.Symbols.popScope();

    const type = { type: 'function', returnsPromise: false, returnType: bodyResult.type.type };
    ctx.type = type;

    // eslint-disable-next-line new-cap
    if (ctx.Identifier()) {
      // eslint-disable-next-line new-cap
      const id = this.visit(ctx.Identifier());
      this.Symbols.add(id, type);
    }

    return this.visitChildren(ctx);
  }

  visitAssignmentExpression(ctx): string {
    const lhs = this.visit(ctx.singleExpression());
    const rhs = this.visit(ctx.expressionSequence());
    const typedChild = this._getType(ctx.expressionSequence());
    this.Symbols.add(lhs, typedChild.type);

    // eslint-disable-next-line new-cap
    return `${lhs} ${this.visit(ctx.Assign())} ${rhs}`;
  }

  visitFuncCallExpression(ctx): string {
    const lhsNode = ctx.singleExpression();
    const lhs = this.visit(lhsNode);
    const rhs = this.visit(ctx.arguments());
    const lhsType = lhsNode.type;
    ctx.type = lhsType.returnType;
    if (lhsType.returnsPromise) {
      return `(await ${lhs})`;
    }
    return `${lhs}${rhs}`;
  }

  visitGetAttributeExpression(ctx): string {
    const lhsNode = ctx.singleExpression();
    const lhs = this.visit(lhsNode);
    const lhsType = lhsNode.type;
    const rhs = this.visit(ctx.identifierName());
    if (rhs in lhsType.attributes) {
      ctx.type = lhsType.attributes[rhs];
    } else if (lhsType.type === 'Database') {
      ctx.type = this.Types.Collection;
    }
    return `${lhs}.${rhs}`;
  }

  visitIdentifierExpression(ctx): string {
    const is = this.visitChildren(ctx);
    let type = this.Symbols.lookup(is);
    if (typeof type === 'string') {
      type = this.Types[type];
    }
    ctx.type = type;
    return is;
  }
}