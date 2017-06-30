/**
 * Uses Socket.io to detect updates, deletions, and creations and updates a property on the store with the changes
 */
const feathers = require('./api/feathers.service')

// The id property to identify list items by
const idProperty = '_id'

// ### liveSyncWithServer(service, storeProperty, store)
/**
 * Syncs a store list with an api endpoint list
 * @param {string} service Api endpoint to sync with
 * @param {string} storeProperty The property to update on the store
 * @param {object} store The store to update with
 * @return {nothing}
 */

function convertStoreArrayToHash(store, storeProperty, idProperty) {
  if(store[storeProperty] && Array.isArray(store[storeProperty])) {
    store[storeProperty] = _.keyBy(store[storeProperty], idProperty)
  }
}

function liveSyncWithServer(service, storeProperty, store) {

  if(typeof window === 'undefined') { return false }

  // Adds items to the local list that were added to the server
  feathers.service(service).on('created', items => {
    items = _.castArray(items)

    convertStoreArrayToHash(store, storeProperty, idProperty)

    store[storeProperty] = Object.assign({}, store[storeProperty], _.keyBy(items, idProperty))
  })

  // Updates items in local list that were patched from the server
  feathers.service(service).on('patched', items => {
    items = _.castArray(items)
    
    convertStoreArrayToHash(store, storeProperty, idProperty)

    store[storeProperty] = Object.assign({}, store[storeProperty], _.keyBy(items, idProperty))
  })

  // Updates items in local list that were updated from the server
  feathers.service(service).on('updated', items => {
    items = _.castArray(items)

    convertStoreArrayToHash(store, storeProperty, idProperty)

    store[storeProperty] = Object.assign({}, store[storeProperty], _.keyBy(items, idProperty))
  })

  // Removes items from local list that were removed from the server
  feathers.service(service).on('removed', items => {
    items = _.castArray(items)

    convertStoreArrayToHash(store, storeProperty, idProperty)

    let itemsHash = _.keyBy(items, idProperty)

    store[storeProperty] = _.pickBy(store[storeProperty], function(item, key) {
      if(!itemsHash[key]) { return item }
    })
  })
}

function prepareSyncList(store) {
  global.syncList = _.partialRight(liveSyncWithServer, store)
  return global.syncList
}

global.prepareSyncList = prepareSyncList
module.exports = prepareSyncList
