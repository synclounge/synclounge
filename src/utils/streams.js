import { fetchBodyReader } from '@/utils/fetchutils';

const makeReaderDecoder = (encoding, reader) => {
  // TODO: investivgate ignoreBOM. libjass had it but do I need or want it?
  const decoder = new TextDecoder(encoding, { ignoreBOM: true });
  const readAndDecode = async () => {
    const { value, done } = await reader.read();
    const text = value ? decoder.decode(value, { stream: !done }) : '';

    return { text, done };
  };

  return readAndDecode;
};

// https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read
async function* fetchLineGenerator(url, signal) {
  const reader = await fetchBodyReader(url, null, { signal });

  const readerDecoder = makeReaderDecoder('utf-8', reader);
  let { text: buffer, done } = await readerDecoder();

  while (true) {
    const firstNewlineIndex = buffer.indexOf('\n');
    if (firstNewlineIndex === -1) {
      // If no new line
      if (done) {
        // No more data.
        yield buffer.length > 0
          ? buffer
          : null;

        break;
      } else {
        // If reader isn't done, read more
        let text;
        // eslint-disable-next-line no-await-in-loop
        ({ text, done } = await readerDecoder());
        buffer += text;
      }
    } else {
      // If we found a new line
      yield buffer.substring(0, firstNewlineIndex);
      buffer = buffer.substr(firstNewlineIndex + 1);
    }
  }
}

const extractValue = async (nextPromise) => {
  try {
    const { done, value } = await nextPromise;
    return done
      ? null
      : value;
  } catch (e) {
    return null;
  }
};

const resiliantStreamFactory = (url, signal) => {
  const asyncGenerator = fetchLineGenerator(url, signal);

  // Return it in a format that StreamParser expects
  return {
    nextLine: () => extractValue(asyncGenerator.next()),
  };
};

export default resiliantStreamFactory;
