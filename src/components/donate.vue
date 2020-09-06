<template>
  <v-dialog
    v-model="donateDialog"
    max-width="650px"
  >
    <template v-slot:activator="stuff">
      <slot
        v-bind="stuff"
      />
    </template>

    <v-card>
      <v-card-title class="title">
        <div>
          Donate
        </div>

        <div class="ml-auto">
          <img
            src="@/assets/images/logos/logo-small-light.png"
            height="50"
          >
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <p class="pa-2">
          All donations to SyncLounge go directly towards running the SyncLounge
          public servers and the continued development of the application.
        </p>

        <v-subheader> How to donate </v-subheader>

        <v-row
          justify="center"
          align="center"
          class="pa-0 ma-1"
        >
          <v-col
            cols="4"
            class="text-center"
          >
            <v-btn
              block
              color="primary"
              class="white--text"
              target="_blank"
              href="https://paypal.me/PlexTogether"
            >
              Paypal
            </v-btn>
          </v-col>
        </v-row>

        <div class="text-center pa-2">
          <v-row
            v-for="(address, coin) in addresses"
            :key="coin"
            justify="center"
            align="center"
            class="pa-0 ma-1"
          >
            <v-col
              cols="2"
              style="font-weight: 600;"
            >
              {{ coin }}
            </v-col>

            <v-col cols="8">
              {{ address }}
            </v-col>

            <v-col
              cols="2"
              class="text-center"
            >
              <v-icon
                v-clipboard="() => address"
                v-clipboard:success="onAddressCopied"
                class="mr-2 primary--text clickable"
              >
                content_copy
              </v-icon>
            </v-col>
          </v-row>
        </div>

        <v-divider />

        <p class="pa-2 soft-text mb-0 pb-0">
          If you make a donation, stop by the Discord and message samcm#2715
          to get your Donator role. Thankyou!
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary"
          @click="donateDialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      donateDialog: false,
      addresses: {
        ETH: '0xC886a3b94867AC12901220BBcbFD407e60E009A5',
        LTC: 'LQkfMbcFGQgMZWw13hbzbYkRkSM6n1fZjE',
        BTC: '3Q7wZnUdJMQi53eH3dErms9Tno7VGmTHZL',
        BCH: '1K3ULWzW9dLyGbtpnNqUysHuj1suZFXtx4',
      },
    };
  },

  methods: {
    ...mapActions([
      'DISPLAY_NOTIFICATION',
    ]),

    onAddressCopied() {
      return this.DISPLAY_NOTIFICATION({
        text: 'Copied',
        color: 'success',
      });
    },
  },
};
</script>
