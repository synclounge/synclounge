<template>
    <div v-tooltip="tooltipMsg" class="mdc-list-item" href="#" style="height: 30px">
        {{ object.name }}
    </div>
</template>

<script>
export default {
    props: ['object'],
    name: 'plexserver',
    computed: {
        tooltipMsg: function() {
            return this.object.name + ' running on ' + this.object.platform + ' (Version ' + this.object.productVersion + ')'
        }
    }
}
</script>

