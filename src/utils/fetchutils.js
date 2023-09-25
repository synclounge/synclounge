export const makeUrl = (url, params) => {
  if (!params) {
    return url;
  }
  const queryStr = (new URLSearchParams(params)).toString();
  return `${url}?${queryStr}`;
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

export const fetchText = async (...args) => {
  const response = await queryFetch(...args);
  return response.text();
};

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
  const text = await fetchText(...args);

  const xmlutils = (await import('@/utils/xmlutils')).default;
  return xmlutils.parse(text);
};

export const fetchBodyReader = async (...args) => {
  const response = await queryFetch(...args);
  return response.body.getReader();
};
