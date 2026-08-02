/**
 * Production configuration.
 *
 * Both values come from the Terraform outputs — see infra/README.md. They are
 * public by nature: the Google client ID is designed to be exposed in the
 * browser, and the API enforces authorisation server-side.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://g9nrncbmuc.execute-api.eu-west-2.amazonaws.com',
  googleClientId: '311710479830-0g2bsimg3l1ao2c56h9ie645g9st4lp4.apps.googleusercontent.com',
};
