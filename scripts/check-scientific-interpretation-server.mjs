import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryFile = "api/scientific-interpretation.ts";

const resolveSourceModule = (importer, specifier) => {
  const emittedPath = resolve(dirname(importer), specifier);
  const candidates = specifier.endsWith(".js")
    ? [emittedPath.slice(0, -3) + ".ts", emittedPath.slice(0, -3) + ".tsx", emittedPath]
    : [emittedPath];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
};

const moduleReferences = (filePath) => {
  const sourceText = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const references = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      references.push({
        specifier: node.moduleSpecifier.text,
        runtime: node.importClause?.isTypeOnly !== true,
        dynamic: false,
      });
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      references.push({ specifier: node.moduleSpecifier.text, runtime: node.isTypeOnly !== true, dynamic: false });
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      references.push({ specifier: node.arguments[0].text, runtime: true, dynamic: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return references;
};

export const collectScientificInterpretationServerGraph = () => {
  const pending = [resolve(repositoryRoot, entryFile)];
  const visited = new Set();
  const violations = [];
  while (pending.length) {
    const filePath = pending.pop();
    if (!filePath || visited.has(filePath)) continue;
    visited.add(filePath);
    for (const reference of moduleReferences(filePath)) {
      if (!reference.runtime) continue;
      const sourceRef = `${relative(repositoryRoot, filePath)} -> ${reference.specifier}`;
      if (reference.specifier.startsWith("@/")) {
        violations.push(`RUNTIME_ALIAS:${sourceRef}`);
        continue;
      }
      if (!reference.specifier.startsWith(".")) continue;
      if (!/\.(?:js|json)$/.test(reference.specifier)) {
        violations.push(`EXTENSIONLESS_RELATIVE_IMPORT:${sourceRef}`);
        continue;
      }
      const target = resolveSourceModule(filePath, reference.specifier);
      if (!target) {
        violations.push(`UNRESOLVED_RELATIVE_IMPORT:${sourceRef}`);
        continue;
      }
      if (!reference.dynamic && target.startsWith(repositoryRoot)) pending.push(target);
    }
  }
  return { files: [...visited].sort(), violations };
};

const loadHandlerWithNodeEsm = async (files) => {
  const smokeRoot = mkdtempSync(join(repositoryRoot, ".scientific-interpretation-esm-smoke-"));
  try {
    writeFileSync(join(smokeRoot, "package.json"), '{"type":"module"}\n');
    for (const sourcePath of files) {
      const sourceRelativePath = relative(repositoryRoot, sourcePath);
      const outputRelativePath = sourceRelativePath.replace(/\.tsx?$/, ".js");
      const outputPath = join(smokeRoot, outputRelativePath);
      if (isAbsolute(outputRelativePath) || outputRelativePath.startsWith("..")) throw new Error(`OUT_OF_REPOSITORY_SOURCE:${sourcePath}`);
      mkdirSync(dirname(outputPath), { recursive: true });
      const transpiled = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
        fileName: sourcePath,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          verbatimModuleSyntax: true,
        },
      });
      writeFileSync(outputPath, transpiled.outputText);
    }
    const loaded = await import(`${pathToFileURL(join(smokeRoot, "api/scientific-interpretation.js")).href}?smoke=${Date.now()}`);
    if (typeof loaded.default !== "function" || typeof loaded.handleScientificInterpretation !== "function") {
      throw new Error("SCIENTIFIC_INTERPRETATION_HANDLER_EXPORT_MISSING");
    }
  } finally {
    rmSync(smokeRoot, { recursive: true, force: true });
  }
};

const main = async () => {
  const graph = collectScientificInterpretationServerGraph();
  if (graph.violations.length) throw new Error(graph.violations.join("\n"));
  await loadHandlerWithNodeEsm(graph.files);
  console.log(`STATIC_RUNTIME_MODULES=${graph.files.length}`);
  console.log("RUNTIME_ALIAS_COUNT=0");
  console.log("EXTENSIONLESS_RELATIVE_IMPORT_COUNT=0");
  console.log("NODE_ESM_HANDLER_LOAD=PASS");
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
