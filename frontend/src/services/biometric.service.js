import api from './api';

function base64urlToArrayBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function preparePublicKeyCredentialCreationOptions(serverOpts) {
  const opts = { ...serverOpts };
  opts.challenge = base64urlToArrayBuffer(opts.challenge);
  opts.user.id = base64urlToArrayBuffer(opts.user.id);
  if (opts.excludeCredentials) {
    opts.excludeCredentials = opts.excludeCredentials.map((cred) => ({
      ...cred,
      id: base64urlToArrayBuffer(cred.id),
    }));
  }
  return opts;
}

function preparePublicKeyCredentialRequestOptions(serverOpts) {
  const opts = { ...serverOpts };
  opts.challenge = base64urlToArrayBuffer(opts.challenge);
  if (opts.allowCredentials) {
    opts.allowCredentials = opts.allowCredentials.map((cred) => ({
      ...cred,
      id: base64urlToArrayBuffer(cred.id),
    }));
  }
  return opts;
}

function publicKeyCredentialToJSON(credential) {
  const json = {};
  json.id = credential.id;
  json.type = credential.type;
  json.rawId = arrayBufferToBase64url(credential.rawId);
  if (credential.response) {
    const resp = credential.response;
    json.response = {};
    if (resp.clientDataJSON) json.response.clientDataJSON = arrayBufferToBase64url(resp.clientDataJSON);
    if (resp.attestationObject) json.response.attestationObject = arrayBufferToBase64url(resp.attestationObject);
    if (resp.authenticatorData) json.response.authenticatorData = arrayBufferToBase64url(resp.authenticatorData);
    if (resp.signature) json.response.signature = arrayBufferToBase64url(resp.signature);
    if (resp.userHandle) json.response.userHandle = arrayBufferToBase64url(resp.userHandle);
  }
  return json;
}

export const biometricService = {
  async login() {
    const beginRes = await api.post('/biometric/login-begin');
    const { session_id, ...credentialRequest } = beginRes.data;
    const publicKey = preparePublicKeyCredentialRequestOptions(credentialRequest.publicKey ?? credentialRequest);
    const assertion = await navigator.credentials.get({ publicKey });
    const json = publicKeyCredentialToJSON(assertion);
    json.session_id = session_id;
    const res = await api.post('/biometric/login-complete', json);
    return res.data;
  },

  async register(deviceName) {
    const beginRes = await api.post('/biometric/register-begin');
    const publicKey = preparePublicKeyCredentialCreationOptions(beginRes.data.publicKey);
    const credential = await navigator.credentials.create({ publicKey });
    const json = publicKeyCredentialToJSON(credential);
    json.device_name = deviceName;
    await api.post('/biometric/register-complete', json);
  },

  async authenticate(action, date) {
    const beginRes = await api.post('/biometric/authenticate-begin');
    const publicKey = preparePublicKeyCredentialRequestOptions(beginRes.data.publicKey);
    const assertion = await navigator.credentials.get({ publicKey });
    const json = publicKeyCredentialToJSON(assertion);
    json.action = action;
    if (date) json.date = date;
    const res = await api.post('/biometric/authenticate-complete', json);
    return res.data;
  },

  async credentials() {
    const res = await api.get('/biometric/credentials');
    return res.data;
  },

  async delete(id) {
    await api.delete(`/biometric/credentials/${id}`);
  },
};
