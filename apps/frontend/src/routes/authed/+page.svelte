<script lang="ts">
  import CatalogDashboard from './CatalogDashboard.svelte'

  let { data } = $props()
</script>

<CatalogDashboard workItems={data.workItems} likenessItems={data.likenessItems} locationItems={data.locationItems} />
