export const makeUrl = (url, params) => {
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

export const queryFetch = (url, queryParams, init) => safeFetch(
  makeUrl(url, queryParams),
  init,
);

export const fetchJson = async (url, queryParams, { headers, ...rest } = {}) => {
  const response = await queryFetch(
    url,
    queryParams,
    {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      ...rest,
    },
  );

  return response.json();
};

export const fetchXmlAndTransform = async (...args) => {
  const response = await queryFetch(...args);

  const text = await response.text();

  const xmlutils = (await import('@/utils/xmlutils')).default;
  return xmlutils.parse(text);
};
