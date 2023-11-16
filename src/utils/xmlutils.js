import { XMLParser } from 'fast-xml-parser';

const options = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
  arrayMode: true,
};

const parser = new XMLParser();

export default {
  parse: (xml) => parser.parse(xml, options),
};
