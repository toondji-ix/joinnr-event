import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../docs/prototype/index.html', import.meta.url), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Minimal document adapter tests simulation behavior, not browser rendering or authorization.
function prototype() {
  const handlers = new Map();
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        innerHTML: '',
        textContent: '',
        value: '',
        checked: false,
        focus() {},
        querySelector() {
          return { focus() {} };
        },
        addEventListener(name, handler) {
          handlers.set(`${id}:${name}`, handler);
        },
      });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: {
      querySelector: element,
      querySelectorAll: () => [],
      getElementById: (id) => elements.get(`#${id}`) ?? null,
      addEventListener: (name, handler) => handlers.set(name, handler),
    },
    location: { reload() {} },
  });
  vm.runInContext(source, context);
  return {
    show: (setup) => vm.runInContext(`${setup}; render();`, context),
    click: (action) =>
      handlers.get('click')({ target: { closest: () => ({ dataset: { action } }) } }),
    content: () => element('#screen').innerHTML,
    input: (id, value) => {
      element(`#${id}`).value = value;
    },
    condition: (value) => handlers.get('#condition:change')({ target: { value } }),
  };
}

test('contact demonstration requires acceptance and two grants; revoke/block and unavailable states hide it', () => {
  const page = prototype();
  page.show("state.screen='connections'");
  assert.doesNotMatch(page.content(), /peer-b@example/);
  page.click('accept');
  page.click('grant');
  assert.doesNotMatch(page.content(), /peer-b@example/);
  page.show('state.peer=true');
  assert.match(page.content(), /peer-b@example/);
  assert.doesNotMatch(page.content(), /Connected\. Contact details remain private/);
  page.click('grant');
  assert.doesNotMatch(page.content(), /peer-b@example/);
  page.click('grant');
  for (const condition of ['offline', 'denied', 'closed', 'cancelled', 'session']) {
    page.show(`state.condition='${condition}'`);
    assert.doesNotMatch(page.content(), /peer-b@example/);
  }
  page.show("state.condition='ready'");
  page.click('block');
  assert.doesNotMatch(page.content(), /peer-b@example/);
  assert.match(page.content(), /Request unavailable/);
});

test('manual access draft survives offline recovery', () => {
  const page = prototype();
  page.input('code', 'DEMO26');
  page.condition('offline');
  page.condition('ready');
  assert.match(page.content(), /value="DEMO26"/);
});

test('public preview escapes input and omits private answers; skipping style reaches review', () => {
  const page = prototype();
  page.show(
    "state.screen='profile';state.step=3;state.style=true;state.name='<img>';state.goal='PRIVATE_GOAL'",
  );
  page.click('skip');
  assert.match(page.content(), /Your public preview/);
  assert.match(page.content(), /&lt;img&gt;/);
  assert.doesNotMatch(page.content(), /PRIVATE_GOAL|<img>/);
});

test('declining removes the received actions and sending remains pending', () => {
  const page = prototype();
  page.show("state.screen='connections'");
  page.click('decline');
  assert.doesNotMatch(page.content(), /data-action="accept"/);
  page.click('send');
  assert.match(page.content(), /Pending their review/);
  assert.doesNotMatch(page.content(), /peer-b@example/);
});
