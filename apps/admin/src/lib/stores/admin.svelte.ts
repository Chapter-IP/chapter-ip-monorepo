class AdminStore {
  isClientAdmin = $state(false)

  set(value: boolean) {
    this.isClientAdmin = value
  }
}

export const adminStore = new AdminStore()
