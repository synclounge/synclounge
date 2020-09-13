const getContentLink = ({ machineIdentifier, ratingKey }) => ({
  name: 'PlexMedia',
  params: {
    machineIdentifier,
    ratingKey,
  },
});

export default getContentLink;
