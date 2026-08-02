import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface TrusteeUser {
  email: string;
  name: string;
  picture?: string;
  /** Token expiry as epoch seconds. */
  exp: number;
}

interface GoogleCredentialResponse {
  credential: string;
}

/** Minimal shape of the parts of Google Identity Services we use. */
interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          text?: string;
          shape?: string;
          width?: number;
        },
      ): void;
      disableAutoSelect(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const STORAGE_KEY = 'apcl.trustee.token';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Google sign-in for the trustee admin area.
 *
 * We use the Identity Services ID-token flow: Google returns a signed JWT, we
 * hold it in memory (mirrored to sessionStorage so a refresh does not sign the
 * trustee out), and send it as a bearer token. The API verifies the signature
 * and checks the email against the trustee allowlist — the client is never the
 * authority on who is allowed in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<string | null>(null);
  private readonly user = signal<TrusteeUser | null>(null);
  private scriptPromise?: Promise<void>;

  readonly currentUser = this.user.asReadonly();
  readonly isSignedIn = computed(() => {
    const user = this.user();
    return user !== null && user.exp * 1000 > Date.now();
  });

  constructor() {
    this.restoreSession();
  }

  getToken(): string | null {
    return this.isSignedIn() ? this.token() : null;
  }

  /**
   * Loads the Google script and draws the official sign-in button into `host`.
   * Rejects when no client ID is configured so the UI can explain why.
   */
  async renderSignInButton(host: HTMLElement): Promise<void> {
    if (!environment.googleClientId) {
      throw new Error('No Google client ID configured.');
    }

    await this.loadScript();
    const google = window.google;
    if (!google) {
      throw new Error('Google Identity Services failed to load.');
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.handleCredential(response.credential),
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(host, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 280,
    });
  }

  signOut(): void {
    window.google?.accounts.id.disableAutoSelect();
    this.token.set(null);
    this.user.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private handleCredential(credential: string): void {
    const user = decodeIdToken(credential);
    if (!user) {
      return;
    }
    this.token.set(credential);
    this.user.set(user);
    sessionStorage.setItem(STORAGE_KEY, credential);
  }

  private restoreSession(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    const user = decodeIdToken(stored);
    if (!user || user.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    this.token.set(stored);
    this.user.set(user);
  }

  private loadScript(): Promise<void> {
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not reach Google sign-in.'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}

/**
 * Reads the claims out of a Google ID token.
 *
 * This is for display only — it deliberately does not verify the signature,
 * which happens in the Lambda authoriser.
 */
function decodeIdToken(token: string): TrusteeUser | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalised)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const claims = JSON.parse(json) as {
      email?: string;
      name?: string;
      picture?: string;
      exp?: number;
    };
    if (!claims.email || !claims.exp) {
      return null;
    }
    return {
      email: claims.email,
      name: claims.name ?? claims.email,
      picture: claims.picture,
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}
