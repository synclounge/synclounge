import linkWithRoom from '@/mixins/helpers/linkwithroom';

const contentLink = (getters, { machineIdentifier, ratingKey }) => linkWithRoom(getters, {
  name: 'PlexMedia',
  params: {
    machineIdentifier,
    ratingKey,
  },
});

export default contentLink;
