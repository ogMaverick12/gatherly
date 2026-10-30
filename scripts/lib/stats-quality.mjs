import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import ts from 'typescript';
import { findFiles, ROOT, SOURCE_EXTENSIONS, SOURCE_FOLDERS } from './stats-utils.mjs';

/** The only tags that excuse a long logic function. */
const LONG_OK_TAGS = new Set(['// long-ok: data table', '// long-ok: closed switch']);

/** A function-like node the size rule applies to. */
function isMeasuredFunction(node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessor(node) ||
    ts.isSetAccessor(node)
  ) {
    return true;
  }
  if (
    ts.isPropertyAssignment(node) &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  ) {
    return true;
  }
  return (
    ts.isVariableDeclaration(node) &&
    Boolean(node.initializer) &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  );
}

/** The name a report should show for a measured function. */
function functionName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  const parent = node.parent;
  if (parent && ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  if (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
    return node.parent.name.text;
  }
  return '(anonymous)';
}

/** True when the body contains JSX, which marks a PascalCase function as a component. */
function containsJsx(node) {
  let found = false;
  const visit = (child) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

/** True for a PascalCase function that renders JSX. */
function isReactComponent(node, name) {
  return /^[A-Z]/.test(name) && containsJsx(node);
}

/** True when the exact long-ok tag sits in the three lines above the function. */
function hasLongOkTag(lines, start) {
  return lines.slice(Math.max(0, start - 3), start).some((line) => LONG_OK_TAGS.has(line.trim()));
}

/** Record one function in the component or logic list when it exceeds its limit. */
function addFunctionMeasurement(node, sourceFile, shown, lines, lists) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, false)).line;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
  const length = end - start + 1;
  const name = functionName(node);
  const where = `${shown}:${start + 1} ${name} (${length} lines)`;
  if (isReactComponent(node, name)) {
    if (length > 80) lists.longComponents.push(where);
    return;
  }
  if (length > 40 && !hasLongOkTag(lines, start)) lists.longLogic.push(where);
}

/** True for an exported function or constant, the two things that need a JSDoc block. */
function isDocumentedExport(node) {
  const exported = node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );
  if (!exported) return false;
  if (ts.isFunctionDeclaration(node)) return true;
  if (ts.isVariableStatement(node)) return true;
  return false;
}

/** Record an exported function or constant whose doc block is missing. */
function addUndocumented(node, sourceFile, shown, lists) {
  if (!isDocumentedExport(node)) return;
  const before = sourceFile.text.slice(node.getFullStart(), node.getStart(sourceFile, false));
  if (before.includes('/**')) return;
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, false)).line;
  lists.undocumented.push(`${shown}:${start + 1} ${functionName(node)}`);
}

/** Walk the AST once, collecting all four quality lists. */
function visitNode(node, sourceFile, shown, lines, lists) {
  if (isMeasuredFunction(node) && node.body) {
    addFunctionMeasurement(node, sourceFile, shown, lines, lists);
  }
  addUndocumented(node, sourceFile, shown, lists);
  ts.forEachChild(node, (child) => visitNode(child, sourceFile, shown, lines, lists));
}

/** The source files the quality lists measure. */
function sourceFiles() {
  return SOURCE_FOLDERS.flatMap((folder) =>
    findFiles(folder, (file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))),
  );
}

/** Measure one file: its length, function sizes and undocumented exports. */
function measureFile(file, lists) {
  const text = readFileSync(file, 'utf8');
  const shown = relative(ROOT, file).split(sep).join('/');
  const lines = text.split('\n');
  if (lines.length > 200) lists.longFiles.push(`${shown} (${lines.length} lines)`);
  const sourceFile = ts.createSourceFile(
    shown,
    text,
    ts.ScriptTarget.Latest,
    true,
    shown.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : shown.endsWith('.mjs')
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS,
  );
  visitNode(sourceFile, sourceFile, shown, lines, lists);
}

/** The quality lists: long files, long logic, long components, undocumented exports. */
export function qualityLists() {
  const lists = { longFiles: [], longLogic: [], longComponents: [], undocumented: [] };
  for (const file of sourceFiles()) measureFile(file, lists);
  return lists;
}
