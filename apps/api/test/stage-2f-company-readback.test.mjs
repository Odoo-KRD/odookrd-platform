import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serviceFile =
  process.env.ODOOKRD_COMPANY_READ_SOURCE ??
  join(apiRoot, 'src/modules/companies/companies.service.ts');
const require = createRequire(join(apiRoot, 'package.json'));
const ts = require('typescript');
const source = readFileSync(serviceFile, 'utf8');
const tree = ts.createSourceFile(
  serviceFile,
  source,
  ts.ScriptTarget.Latest,
  true,
  serviceFile.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS,
);

assert.equal(
  tree.parseDiagnostics.length,
  0,
  'The company service must remain parseable.',
);

function propertyName(node) {
  return node && (ts.isIdentifier(node) || ts.isStringLiteral(node))
    ? node.text
    : undefined;
}

function unwrap(node) {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node))
  ) {
    node = node.expression;
  }

  return node;
}

function objectFrom(value) {
  const unwrapped = unwrap(value);

  if (unwrapped && ts.isObjectLiteralExpression(unwrapped)) {
    return unwrapped;
  }

  if (!unwrapped || !ts.isIdentifier(unwrapped)) {
    return undefined;
  }

  let resolved;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === unwrapped.text &&
      node.initializer
    ) {
      resolved = objectFrom(node.initializer);
    }

    if (!resolved) {
      ts.forEachChild(node, visit);
    }
  }

  visit(tree);
  return resolved;
}

function companyProjection(methodName, queryName) {
  const matches = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const query = node.expression;
      const receiver = query.expression;

      if (
        query.name.text === queryName &&
        ts.isPropertyAccessExpression(receiver) &&
        receiver.name.text === 'company'
      ) {
        let owner = node.parent;

        while (owner && !ts.isMethodDeclaration(owner)) {
          owner = owner.parent;
        }

        if (owner && propertyName(owner.name) === methodName) {
          const argument = objectFrom(node.arguments[0]);
          const select = argument?.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) &&
              propertyName(property.name) === 'select',
          );
          const selection = select ? objectFrom(select.initializer) : undefined;

          assert.ok(
            selection,
            `${methodName}() must retain its explicit Prisma projection.`,
          );
          matches.push(selection);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(tree);
  assert.equal(
    matches.length,
    1,
    `${methodName}() must have one company read query.`,
  );

  return Object.fromEntries(
    matches[0].properties
      .filter((property) => ts.isPropertyAssignment(property))
      .map((property) => [
        propertyName(property.name),
        property.initializer.kind === ts.SyntaxKind.TrueKeyword,
      ]),
  );
}

const storedCompany = {
  id: 'company-001',
  name: 'کۆمپانیای بیگ پاوەر',
  nameTranslations: {
    ku: 'کۆمپانیای بیگ پاوەر',
    ar: 'شركة بيغ باور',
    en: 'BigPower Company',
  },
  status: 'ACTIVE',
  createdAt: '2026-08-22T00:00:00.000Z',
  updatedAt: '2026-08-22T00:00:00.000Z',
};

function project(record, selection) {
  return Object.fromEntries(
    Object.entries(record).filter(([field]) => selection[field] === true),
  );
}

test('company lists include stored Kurdish, Arabic, and English names', () => {
  const selection = companyProjection('list', 'findMany');
  const company = project(storedCompany, selection);

  assert.equal(selection.name, true);
  assert.equal(selection.nameTranslations, true);
  assert.deepEqual(company.nameTranslations, storedCompany.nameTranslations);
});

test('company details return all translations after saving and reloading', () => {
  const selection = companyProjection('getById', 'findUnique');
  const company = project(storedCompany, selection);

  assert.equal(selection.id, true);
  assert.equal(selection.name, true);
  assert.equal(selection.nameTranslations, true);
  assert.deepEqual(company.nameTranslations, storedCompany.nameTranslations);
  assert.equal(company.nameTranslations.ar, 'شركة بيغ باور');
  assert.equal(company.nameTranslations.en, 'BigPower Company');
});
