import parser from 'fast-xml-parser';

const options = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
  arrayMode: true,
};

export default {
  parse: (xml) => parser.parse(xml, options),
};
