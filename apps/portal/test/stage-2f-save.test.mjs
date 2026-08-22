import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const requireFromPortal = createRequire(path.join(portalRoot, "package.json"));
const typescript = requireFromPortal("typescript");
const validIdentifier = "11111111-1111-4111-8111-111111111111";
const otherIdentifier = "22222222-2222-4222-8222-222222222222";

function source(relativePath) {
  return readFileSync(path.join(portalRoot, relativePath), "utf8");
}

function loadTypescript(relativePath, dependencies) {
  const filename = path.join(portalRoot, relativePath);
  const javascript = typescript.transpileModule(source(relativePath), {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const loaded = { exports: {} };

  vm.runInNewContext(
    javascript,
    {
      module: loaded,
      exports: loaded.exports,
      require(specifier) {
        if (!(specifier in dependencies)) {
          throw new Error("Unexpected server-action dependency: " + specifier);
        }

        return dependencies[specifier];
      },
      FormData,
      URL,
    },
    { filename },
  );

  return loaded.exports;
}

class RedirectSignal extends Error {
  constructor(destination) {
    super("NEXT_REDIRECT");
    this.destination = destination;
  }
}

function actionHarness() {
  const requests = [];
  const localized = loadTypescript("src/lib/i18n/content.ts", {
    "@/lib/i18n/config": { SUPPORTED_LOCALES: ["ku", "ar", "en"] },
  });
  const dependencies = {
    "@odookrd/types": {
      PERMISSIONS: {
        COMPANIES_MANAGE: "companies.manage",
        SERVICES_MANAGE: "services.manage",
      },
    },
    "next/cache": { revalidatePath() {} },
    "next/navigation": {
      redirect(destination) {
        throw new RedirectSignal(destination);
      },
    },
    "@/lib/api": {
      ApiRequestError: class ApiRequestError extends Error {},
      async apiRequest(endpoint, options) {
        requests.push({
          endpoint,
          method: options.method,
          body: JSON.parse(options.body),
        });

        return { id: validIdentifier };
      },
    },
    "@/lib/authorization": {
      async getAdminApiContext() {
        return {
          session: { user: { accountScope: "PLATFORM", companyId: null } },
          token: "test-session",
        };
      },
    },
    "@/lib/forms": {},
    "@/lib/i18n/content": localized,
  };

  return {
    requests,
    localized,
    companies: loadTypescript(
      "src/app/(protected)/admin/companies/actions.ts",
      dependencies,
    ),
    services: loadTypescript(
      "src/app/(protected)/admin/services/actions.ts",
      dependencies,
    ),
  };
}

async function submit(action, values) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  try {
    const result = await action({ message: null }, formData);

    assert.fail(
      "The server action rejected valid multilingual data: " +
        JSON.stringify(result),
    );
  } catch (error) {
    if (!(error instanceof RedirectSignal)) throw error;
  }
}

const names = {
  "name.ku": "کۆمپانیای تاقیکردنەوە",
  "name.ar": "شركة الاختبار",
  "name.en": "Test Company",
};

test("multilingual editors stay controlled when React resets a completed form action", () => {
  const editor = source("src/components/i18n/localized-text-fields.tsx");

  assert.match(editor, /^["']use client["'];/);
  assert.match(editor, /useState<LocalizedText>/);
  assert.match(editor, /setValues\(/);
  const controlledFields = (editor.match(/value=\{value\}/g) ?? []).length;
  const changeHandlers = (editor.match(/onChange=\{/g) ?? []).length;

  assert.ok(
    controlledFields >= 2,
    "The visible multilingual input and textarea must remain controlled.",
  );
  assert.equal(
    changeHandlers,
    controlledFields,
    "Every controlled visible or popup field must have a matching change handler.",
  );
  assert.doesNotMatch(editor, /defaultValue=\{value\}/);
});

test("all three language fields become a single validated translation payload", () => {
  const { localized } = actionHarness();
  const formData = new FormData();

  for (const [key, value] of Object.entries(names)) formData.set(key, value);

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(localized.localizedFormValues(formData, "name", 200)),
    ),
    {
      ku: names["name.ku"],
      ar: names["name.ar"],
      en: names["name.en"],
    },
  );
});

test("company create and update submit Kurdish, Arabic, and English to NestJS", async () => {
  const { companies, requests } = actionHarness();

  await submit(companies.createCompanyAction, names);
  await submit(
    companies.updateCompanyAction.bind(null, validIdentifier),
    names,
  );

  assert.deepEqual(
    requests.map(({ body }) => body.nameTranslations),
    [
      { ku: names["name.ku"], ar: names["name.ar"], en: names["name.en"] },
      { ku: names["name.ku"], ar: names["name.ar"], en: names["name.en"] },
    ],
  );
});

test("service create and update submit multilingual names and descriptions", async () => {
  const { services, requests } = actionHarness();
  const values = {
    ...names,
    key: "managed-odoo",
    category: "ODOO",
    status: "ACTIVE",
    "description.ku": "وەسفی کوردی",
    "description.ar": "الوصف العربي",
    "description.en": "English description",
  };

  await submit(services.createServiceAction, values);
  await submit(
    services.updateServiceAction.bind(null, validIdentifier),
    values,
  );

  for (const { body } of requests) {
    assert.equal(body.nameTranslations.ku, names["name.ku"]);
    assert.equal(body.nameTranslations.ar, names["name.ar"]);
    assert.equal(body.nameTranslations.en, names["name.en"]);
    assert.equal(body.descriptionTranslations.ku, values["description.ku"]);
    assert.equal(body.descriptionTranslations.ar, values["description.ar"]);
    assert.equal(body.descriptionTranslations.en, values["description.en"]);
  }
});

test("company-specific service assignments submit multilingual display names", async () => {
  const { services, requests } = actionHarness();
  const values = {
    companyId: validIdentifier,
    serviceId: otherIdentifier,
    status: "ACTIVE",
    serviceUrl: "",
    startsAt: "",
    expiresAt: "",
    notes: "",
    internalNotes: "",
    "displayName.ku": "خزمەتگوزاری",
    "displayName.ar": "الخدمة",
    "displayName.en": "Service",
  };

  await submit(services.createAssignmentAction, values);
  await submit(
    services.updateAssignmentAction.bind(null, validIdentifier),
    values,
  );

  for (const { body } of requests) {
    assert.deepEqual(body.displayNameTranslations, {
      ku: values["displayName.ku"],
      ar: values["displayName.ar"],
      en: values["displayName.en"],
    });
  }
});
