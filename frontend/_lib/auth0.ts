import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { requiredEnv } from "@/utils/env-reader";

export const auth0 = new Auth0Client({
  domain: requiredEnv("AUTH0_DOMAIN"),
  clientId: requiredEnv("AUTH0_CLIENT_ID"),
  clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
  appBaseUrl: requiredEnv("NEXT_PUBLIC_APP_BASE_URL"),
  secret: requiredEnv("AUTH0_SECRET"),
});