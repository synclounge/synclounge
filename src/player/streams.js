import { fetchBodyReader } from '@/utils/fetchutils';
// 400 metal
// 300 ceramic

const makeReaderDecoder = (encoding, reader) => {
  // TODO: investivgate ignoreBOM. libjass had it but do I need or want it?
  const decoder = new TextDecoder(encoding, { ignoreBOM: true });
  const readAndDecode = async () => {
    const { value, done } = await reader.read();
    const text = decoder.decode(value, { stream: !done });

    return { text, done };
  };

  return readAndDecode;
};

async function* fetchLineGenerator(url, signal) {
  const reader = await fetchBodyReader(url, null, { signal });

  const readerDecoder = makeReaderDecoder('utf-8', reader);
  let { text: buffer, done } = await readerDecoder();

  while (true) {
    console.log('loop of fetchLineGenerator ');
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
                console.log('before decode');
        // eslint-disable-next-line no-await-in-loop
        ({ text, done } = await readerDecoder());
        console.log('done reader decode');
        buffer += text;
      }
    } else {
      // If we found a new line
      yield buffer.substring(0, firstNewlineIndex);
      buffer = buffer.substr(firstNewlineIndex + 1);
    }
  }
}

async function* repeatedRunner(url, signal) {
  while (true) {
    console.log('loop of repeatedRunner');
    const asyncGenerator = fetchLineGenerator(url, signal);
    // TODO: error?
    // eslint-disable-next-line no-await-in-loop
    let { value, done } = await asyncGenerator.next();
    while (!done) {
      yield value;
      // eslint-disable-next-line no-await-in-loop
      ({ value, done } = await asyncGenerator.next());
    }
  }
}

const extractValue = async (nextPromise) => {
  const { value } = await nextPromise;
  console.log('value: ', value);
  return value;
};

const resiliantStreamFactory = (url, signal) => {
  const asyncGenerator = repeatedRunner(url, signal);

  // Return it in a format that StreamParser expe cts
  return {
    nextLine: () => {
      console.log('nextLine called');
      return extractValue(asyncGenerator.next());
    },
  };
};

export default resiliantStreamFactory;
