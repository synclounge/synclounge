const cssText = 'position:fixed;pointer-events:none;z-index:-9999;opacity:0;';

const isString = (s) => typeof (s) === 'string' || s instanceof String;

const legacyCopy = (text) => {
  const value = isString(text)
    ? text
    : JSON.stringify(text);

  const textarea = document.createElement('textarea');

  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = cssText;

  document.body.appendChild(textarea);

  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    textarea.contentEditable = true;
    textarea.readOnly = true;

    const range = document.createRange();

    range.selectNodeContents(textarea);

    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(range);
    textarea.setSelectionRange(0, 999999);
  } else {
    textarea.select();
  }

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

export default {
  methods: {
    async copyToClipboard(text) {
      try {
        // The clipboard API can only be used in secure contexts, so fall back to legacy method if
        // this fails
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.warn(e);
      }

      legacyCopy(text);
      await this.$store.dispatch('DISPLAY_NOTIFICATION', {
        text: 'Copied to clipboard',
        color: 'success',
      });
    },
  },
};
