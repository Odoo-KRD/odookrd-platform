import type { Dictionary } from "../types";

export const commonEn = {
  common: {
    brand: "OdooKRD",
    language: "Language",
    platform: "Customer Platform",
    secureAccess: "Secure account access",
  },
  login: {
    title: "Welcome back",
    description: "Sign in to continue to your account.",
    email: "Email address",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in...",
    invalidCredentials: "The email address or password is incorrect.",
    tooManyAttempts: "Too many attempts. Please try again later.",
    unavailable: "The service is currently unavailable.",
  },
  workspace: {
    adminTitle: "Administration workspace",
    adminDescription:
      "The administration foundation is ready for the next step.",
    customerTitle: "Customer workspace",
    customerDescription:
      "Your account is active. The customer workspace arrives in Stage 2.",
    signedInAs: "Signed in as",
    permissions: "Permissions",
    signOut: "Sign out",
    signingOut: "Signing out...",
  },
} satisfies Dictionary;
