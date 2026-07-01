/**
 * GET /api/docs/ui
 *
 * Renders Swagger UI as a standalone HTML page.
 * Points to /api/docs for the OpenAPI 3.1 JSON spec.
 * No authentication required — useful for developer onboarding and partner portals.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AUDT API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      background: #0d0d1a;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* ── Top header bar ──────────────────────────────────────────────────── */
    .audt-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid rgba(99, 102, 241, 0.3);
      padding: 14px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .audt-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .audt-sep {
      width: 1px;
      height: 24px;
      background: rgba(255,255,255,0.15);
    }
    .audt-badge {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #a78bfa;
      border: 1px solid rgba(167,139,250,0.3);
      border-radius: 4px;
      padding: 2px 8px;
    }
    .audt-tagline {
      font-size: 13px;
      color: rgba(255,255,255,0.4);
      margin-left: auto;
    }
    .audt-back {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      padding: 5px 12px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      transition: all 0.15s;
    }
    .audt-back:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.25); }

    /* ── Swagger UI wrapper ───────────────────────────────────────────────── */
    #swagger-ui {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 24px 64px;
    }

    /* ── Swagger UI dark overrides ────────────────────────────────────────── */
    .swagger-ui { background: transparent; }

    .swagger-ui .topbar { display: none; }

    .swagger-ui .info {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
    }
    .swagger-ui .info .title {
      color: #e2e8f0 !important;
      font-size: 24px !important;
      font-weight: 700 !important;
    }
    .swagger-ui .info p,
    .swagger-ui .info li,
    .swagger-ui .info .description p { color: rgba(226,232,240,0.75) !important; font-size: 14px; }
    .swagger-ui .info .version {
      background: rgba(99,102,241,0.2);
      border: 1px solid rgba(99,102,241,0.3);
      color: #a78bfa;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
    }
    .swagger-ui .info a { color: #818cf8 !important; }

    .swagger-ui .servers { display: none; }

    .swagger-ui .scheme-container {
      background: rgba(255,255,255,0.03) !important;
      border-bottom: 1px solid rgba(255,255,255,0.06) !important;
      padding: 12px 20px !important;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .swagger-ui .schemes > label,
    .swagger-ui .scheme-container label,
    .swagger-ui label { color: rgba(226,232,240,0.6) !important; font-size: 12px !important; }

    /* Operation blocks */
    .swagger-ui .opblock {
      background: rgba(255,255,255,0.03) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      border-radius: 8px !important;
      margin-bottom: 8px !important;
    }
    .swagger-ui .opblock:hover { border-color: rgba(99,102,241,0.3) !important; }

    .swagger-ui .opblock .opblock-summary { border-radius: 8px; }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px !important;
      font-weight: 700 !important;
      font-size: 11px !important;
      min-width: 68px !important;
      text-align: center !important;
    }
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path span {
      color: #e2e8f0 !important;
      font-size: 13px !important;
      font-family: "Fira Code", "JetBrains Mono", monospace !important;
    }
    .swagger-ui .opblock .opblock-summary-description { color: rgba(226,232,240,0.5) !important; font-size: 12px !important; }

    .swagger-ui .opblock-body { background: rgba(0,0,0,0.2) !important; }
    .swagger-ui .opblock-section-header {
      background: rgba(255,255,255,0.04) !important;
      border-bottom: 1px solid rgba(255,255,255,0.06) !important;
    }
    .swagger-ui .opblock-section-header label,
    .swagger-ui .opblock-section-header h4 { color: rgba(226,232,240,0.7) !important; }

    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th { color: rgba(226,232,240,0.6) !important; border-bottom-color: rgba(255,255,255,0.08) !important; font-size: 12px !important; }
    .swagger-ui .parameters-col_name { color: #c4b5fd !important; font-family: monospace; }
    .swagger-ui .parameters-col_description { color: rgba(226,232,240,0.75) !important; }
    .swagger-ui .parameter__name { color: #c4b5fd !important; }
    .swagger-ui .parameter__type { color: #34d399 !important; font-size: 11px !important; }
    .swagger-ui .parameter__in { color: rgba(226,232,240,0.4) !important; font-size: 10px !important; }

    .swagger-ui .response-col_status { color: #34d399 !important; font-weight: 700 !important; }
    .swagger-ui .response-col_description { color: rgba(226,232,240,0.75) !important; }

    .swagger-ui .model { background: rgba(0,0,0,0.3) !important; }
    .swagger-ui .model-title { color: #c4b5fd !important; }
    .swagger-ui .model .property { color: #34d399 !important; }
    .swagger-ui .model .property-type { color: #60a5fa !important; }
    .swagger-ui .prop-type { color: #60a5fa !important; }

    .swagger-ui section.models {
      background: rgba(255,255,255,0.02) !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      border-radius: 8px !important;
    }
    .swagger-ui section.models h4 { color: rgba(226,232,240,0.7) !important; }
    .swagger-ui section.models .model-container { background: rgba(0,0,0,0.2) !important; }

    .swagger-ui .tag { color: #e2e8f0 !important; font-size: 16px !important; font-weight: 600 !important; }
    .swagger-ui .tag small { color: rgba(226,232,240,0.5) !important; }

    /* Buttons */
    .swagger-ui .btn { border-radius: 6px !important; font-size: 12px !important; font-weight: 600 !important; }
    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      border-color: transparent !important;
      color: #fff !important;
    }
    .swagger-ui .btn.cancel { color: rgba(226,232,240,0.7) !important; border-color: rgba(255,255,255,0.15) !important; }
    .swagger-ui .btn.authorize { color: #34d399 !important; border-color: rgba(52,211,153,0.4) !important; }
    .swagger-ui .btn.authorize svg { fill: #34d399 !important; }

    /* Inputs */
    .swagger-ui input[type=text],
    .swagger-ui textarea,
    .swagger-ui select {
      background: rgba(0,0,0,0.4) !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 6px !important;
    }
    .swagger-ui input[type=text]:focus,
    .swagger-ui textarea:focus {
      border-color: rgba(99,102,241,0.5) !important;
      outline: none !important;
    }

    /* Code blocks */
    .swagger-ui .microlight,
    .swagger-ui .highlight-code {
      background: rgba(0,0,0,0.5) !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      border-radius: 6px !important;
      color: #e2e8f0 !important;
    }

    /* Auth modal */
    .swagger-ui .dialog-ux .modal-ux {
      background: #1a1a2e !important;
      border: 1px solid rgba(99,102,241,0.3) !important;
      border-radius: 12px !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header { border-bottom-color: rgba(255,255,255,0.08) !important; }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: #e2e8f0 !important; }
    .swagger-ui .auth-wrapper { color: rgba(226,232,240,0.8) !important; }
    .swagger-ui .auth-wrapper .authorization__btn { border-color: rgba(99,102,241,0.3) !important; color: #a78bfa !important; }
    .swagger-ui .scopes h2 { color: rgba(226,232,240,0.7) !important; }
    .swagger-ui .info code { background: rgba(99,102,241,0.15) !important; color: #a78bfa !important; border-radius: 3px; padding: 1px 5px; }

    /* Misc */
    .swagger-ui * { scrollbar-color: rgba(99,102,241,0.3) transparent; scrollbar-width: thin; }
    .swagger-ui .expand-operation svg,
    .swagger-ui .arrow { fill: rgba(226,232,240,0.4) !important; }
    .swagger-ui .copy-to-clipboard { background: rgba(255,255,255,0.05) !important; border-radius: 4px !important; }
    .swagger-ui .copy-to-clipboard button { border-color: rgba(255,255,255,0.1) !important; }
  </style>
</head>
<body>
  <div class="audt-header">
    <div class="audt-logo">AUDT</div>
    <div class="audt-sep"></div>
    <div class="audt-badge">API v1.0</div>
    <span class="audt-tagline">Governance Built on Proof.</span>
    <a class="audt-back" href="/settings/api-keys">← API Keys</a>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "BaseLayout",
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: "none",
        filter: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        withCredentials: false,
        requestInterceptor: function (req) {
          return req;
        },
        onComplete: function () {
          // Auto-scroll to top after load
          window.scrollTo(0, 0);
        },
      });
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
