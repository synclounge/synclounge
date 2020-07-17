const makeUrl = (url, params) => {
  if (!params) {
    return url;
  }

  const urlObj = new URL(url);
  urlObj.search = new URLSearchParams(params).toString();
  return urlObj.toString();
};

const safeFetch = async (...args) => {
  const response = await fetch(...args);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response;
};

export const fetchJson = async (url, queryParams, { headers, ...rest } = {}) => {
  const response = await safeFetch(
    makeUrl(url, queryParams), {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      ...rest,
    },
  );

  return response.json();
};

export const queryFetch = (url, queryParams, init) => safeFetch(
  makeUrl(url, queryParams),
  init,
);

export const fetchXmlAndTransform = async (url, queryParams, { headers, ...rest }) => {
  const response = await safeFetch(
    makeUrl(url, queryParams), {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      ...rest,
    },
  );

  const text = await response.text();

  const xmlutils = (await import('@/utils/xmlutils')).default;
  return xmlutils.parse(text);
};
