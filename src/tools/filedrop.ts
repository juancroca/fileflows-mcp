import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FileFlowsClient } from '../api.js';

export function registerFileDropTools(server: McpServer, client: FileFlowsClient): void {
  // --- General settings ---

  server.tool(
    'ff_get_filedrop_settings',
    'Get FileDrop general settings (Enabled, CustomPort, SessionExpireInMinutes, AllowRegistrations, RequireEmailVerification). Returns 401 if FileDrop license is inactive.',
    {},
    async () => {
      const data = await client.get('/api/file-drop/general');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_settings',
    'Update FileDrop general settings. CustomPort is clamped to [1, 65535]. Changing Enabled, SessionExpireInMinutes, or CustomPort triggers a FileDrop service restart.',
    {
      settings: z.record(z.unknown()).describe(
        'FileDropSettings object with fields: Enabled (bool), CustomPort (int 1-65535), SessionExpireInMinutes (int), AllowRegistrations (bool), RequireEmailVerification (bool)'
      ),
    },
    async ({ settings }) => {
      await client.put('/api/file-drop/general', settings);
      return { content: [{ type: 'text', text: 'FileDrop settings updated' }] };
    }
  );

  // --- Users ---

  server.tool(
    'ff_list_filedrop_users',
    'List all FileDrop users. Returns 400 (not 401) if unlicensed.',
    {},
    async () => {
      const data = await client.get('/api/file-drop/user');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_set_filedrop_user_enabled',
    'Enable or disable a FileDrop user',
    {
      uid: z.string().describe('FileDrop user UID'),
      enabled: z.boolean().describe('true to enable, false to disable'),
    },
    async ({ uid, enabled }) => {
      const data = await client.put(`/api/file-drop/user/state/${uid}?enable=${enabled}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_user_tokens',
    'Update the tokens assigned to a FileDrop user. This endpoint can only update token assignment — it cannot create users. Returns 404 if the user does not already exist.',
    {
      uid: z.string().describe('FileDrop user UID (must already exist)'),
      tokens: z.array(z.unknown()).describe('Array of token objects to assign to this user'),
    },
    async ({ uid, tokens }) => {
      const data = await client.post('/api/file-drop/user', { Uid: uid, Tokens: tokens });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_delete_filedrop_users',
    'Delete one or more FileDrop users by UID',
    { uids: z.array(z.string()).describe('Array of FileDrop user UIDs to delete') },
    async ({ uids }) => {
      await client.delete('/api/file-drop/user', { Uids: uids });
      return { content: [{ type: 'text', text: `Deleted FileDrop users: ${uids.join(', ')}` }] };
    }
  );

  // --- Tokens config ---

  server.tool(
    'ff_get_filedrop_tokens_config',
    'Get FileDrop token purchase configuration (TokenPurchaseUrl, TokenPurchaseInPopup, NewUserTokens)',
    {},
    async () => {
      const data = await client.get('/api/file-drop/tokens');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_tokens_config',
    'Update FileDrop token purchase configuration',
    {
      config: z.record(z.unknown()).describe('Settings object with TokenPurchaseUrl, TokenPurchaseInPopup, NewUserTokens fields'),
    },
    async ({ config }) => {
      await client.put('/api/file-drop/tokens', config);
      return { content: [{ type: 'text', text: 'FileDrop tokens config updated' }] };
    }
  );

  // --- Password policy ---

  server.tool(
    'ff_get_filedrop_password_policy',
    'Get FileDrop password policy. Note: if FormsMinLength is stored as 0, the GET returns 8 (default applied server-side). A GET→PUT round-trip will write 8 even if the stored value was 0.',
    {},
    async () => {
      const data = await client.get('/api/file-drop/passwords');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_password_policy',
    'Update FileDrop password policy (FormsMinLength, FormsRequireDigits, FormsRequireMixedCase, FormsRequireSpecialCharacters)',
    {
      policy: z.record(z.unknown()).describe('Password policy fields: FormsMinLength (int), FormsRequireDigits (bool), FormsRequireMixedCase (bool), FormsRequireSpecialCharacters (bool)'),
    },
    async ({ policy }) => {
      await client.put('/api/file-drop/passwords', policy);
      return { content: [{ type: 'text', text: 'FileDrop password policy updated' }] };
    }
  );

  // --- Auto tokens ---

  server.tool(
    'ff_get_filedrop_auto_tokens',
    'Get FileDrop auto-token grant configuration',
    {},
    async () => {
      const data = await client.get('/api/file-drop/auto-tokens');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_auto_tokens',
    'Update FileDrop auto-token grant configuration (AutoTokens, AutoTokensAmount, AutoTokensMaximum, AutoTokensPeriodMinutes)',
    {
      config: z.record(z.unknown()).describe('Auto-token config fields: AutoTokens (bool), AutoTokensAmount (int), AutoTokensMaximum (int), AutoTokensPeriodMinutes (int)'),
    },
    async ({ config }) => {
      await client.put('/api/file-drop/auto-tokens', config);
      return { content: [{ type: 'text', text: 'FileDrop auto-tokens config updated' }] };
    }
  );

  // --- Custom CSS ---

  server.tool(
    'ff_get_filedrop_custom_css',
    'Get FileDrop custom CSS. Returns a plain string (not JSON-wrapped).',
    {},
    async () => {
      const text = await client.getText('/api/file-drop/custom-css');
      return { content: [{ type: 'text', text: text }] };
    }
  );

  server.tool(
    'ff_update_filedrop_custom_css',
    'Set FileDrop custom CSS. Send a plain CSS string.',
    {
      css: z.string().describe('Custom CSS string to apply to the FileDrop UI'),
    },
    async ({ css }) => {
      await client.put('/api/file-drop/custom-css', css);
      return { content: [{ type: 'text', text: 'FileDrop custom CSS updated' }] };
    }
  );

  // --- hCaptcha ---

  server.tool(
    'ff_get_filedrop_hcaptcha',
    'Get FileDrop hCaptcha configuration (hCaptchaSiteId, hCaptchaSecret)',
    {},
    async () => {
      const data = await client.get('/api/file-drop/hcaptcha');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_hcaptcha',
    'Update FileDrop hCaptcha configuration',
    {
      config: z.record(z.unknown()).describe('hCaptcha config: { hCaptchaSiteId: string, hCaptchaSecret: string }'),
    },
    async ({ config }) => {
      await client.put('/api/file-drop/hcaptcha', config);
      return { content: [{ type: 'text', text: 'FileDrop hCaptcha config updated' }] };
    }
  );

  // --- Home page ---

  server.tool(
    'ff_get_filedrop_home_page',
    'Get the FileDrop home page HTML. Returns a plain HTML string.',
    {},
    async () => {
      const text = await client.getText('/api/file-drop/home-page');
      return { content: [{ type: 'text', text: text }] };
    }
  );

  server.tool(
    'ff_update_filedrop_home_page',
    'Set the FileDrop home page HTML. No sanitization is applied server-side.',
    {
      html: z.string().describe('HTML content for the FileDrop home page'),
    },
    async ({ html }) => {
      await client.put('/api/file-drop/home-page', html);
      return { content: [{ type: 'text', text: 'FileDrop home page updated' }] };
    }
  );

  // --- Single Sign-On ---

  server.tool(
    'ff_get_filedrop_sso',
    'Get FileDrop Single Sign-On configuration (Google, Microsoft, Custom provider)',
    {},
    async () => {
      const data = await client.get('/api/file-drop/single-sign-on');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'ff_update_filedrop_sso',
    'Update FileDrop SSO configuration. Note: CustomProviderName changes are NOT detected by the change-detection logic and will be silently ignored unless another field also changed. Include at least one provider credential field alongside any name-only change.',
    {
      config: z.record(z.unknown()).describe(
        'SSO config object with fields: GoogleClientId, GoogleClientSecret, MicrosoftClientId, MicrosoftClientSecret, CustomProviderName, CustomProviderAuthority, CustomProviderClientId, CustomProviderClientSecret'
      ),
    },
    async ({ config }) => {
      await client.put('/api/file-drop/single-sign-on', config);
      return { content: [{ type: 'text', text: 'FileDrop SSO configuration updated' }] };
    }
  );
}
