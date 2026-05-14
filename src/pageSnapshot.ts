export function collectPageSnapshot(): Promise<PageFormSnapshot> {
  return waitForStability().then(function () {
    return {
      url: location.href,
      title: document.title,
      content: document.body.innerText,
      formFields: collectFormFields(),
    };
  });

  function collectFormFields(): FormFieldInfo[] {
    var elements = document.querySelectorAll('input, textarea');
    var fields: FormFieldInfo[] = [];
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i] as HTMLInputElement | HTMLTextAreaElement;
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') continue;
      var selector = buildSelector(el);
      if (!selector) continue;
      fields.push({
        selector: selector,
        tagName: el.tagName,
        type: (el as HTMLInputElement).type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder || '',
        label: findLabel(el),
      });
    }
    return fields;
  }

  function buildSelector(el: Element): string {
    if (el.id) return '#' + CSS.escape(el.id);
    if ((el as HTMLInputElement).name) {
      return el.tagName.toLowerCase() + '[name="' + (el as HTMLInputElement).name + '"]';
    }
    return '';
  }

  function findLabel(el: HTMLInputElement | HTMLTextAreaElement): string {
    if (el.id) {
      var label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (label) return (label.textContent || '').trim();
    }
    var parent: Element | null = el.parentElement;
    while (parent) {
      if (parent.tagName === 'LABEL') return (parent.textContent || '').trim();
      parent = parent.parentElement;
    }
    return '';
  }

  function waitForStability(): Promise<void> {
    return new Promise(function (resolve) {
      var timer: ReturnType<typeof setTimeout>;
      var maxWait = setTimeout(function () {
        observer.disconnect();
        resolve();
      }, 5000);

      var observer = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          observer.disconnect();
          clearTimeout(maxWait);
          resolve();
        }, 1500);
      });

      observer.observe(document.body, { childList: true, subtree: true });

      timer = setTimeout(function () {
        observer.disconnect();
        clearTimeout(maxWait);
        resolve();
      }, 1500);
    });
  }
}
