import React from 'react'
import _ from 'lodash'
import { app } from '../index'

export default {
  'model.list.pagination': {
    data: ({ modelState }) => {
      const count = modelState.count
      const { limit, skip } = modelState.filter
      
      return {
        items: Math.ceil(count / limit),
        activePage: Math.floor(skip / limit) + 1
      }
    },
    method: {
      changePage: ({ dispatch, modelState, model }) => (page) => {
        const pageSize = modelState.filter.limit
          , skip = pageSize * (page - 1)
        dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, skip: skip } })
      }
    }
  },
  'model.list': {
    data: ({ model }) => {
      return {
        icon: model.icon || model.name,
        title: model.title,
        component: model.list_component,
        canAdd: !!model.permission && !!model.permission.add
      }
    },
    method: {
      addItem: ({ router, model }, { location: { query } }) => () => {
        router.push({ pathname: model.$link.add.path, query })
      },
      getItems: ({ dispatch, modelState, model }, { location: { query } }) => () => {
        let wheres
        if(Object.keys(query).length > 0) {
          wheres = { ...modelState.wheres, param_filter: query }
        } else {
          wheres = _.omit(modelState.wheres, 'param_filter')
        }
        if(!_.isEqual(wheres, modelState.wheres)) {
          dispatch({ model, type: 'GET_ITEMS', items: [], filter: { ...modelState.filter, skip: 0 }, success: true })
        }
        dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter }, wheres })
      }
    }
  },
  'model.list.grid': {
    data: ({ modelState, model }, props, prev) => {
      const { items, ids } = modelState
      return {
        ids,
        items: ids === prev['ids'] ? prev['items'] : ids.map(id => items[id]),
        fields: modelState.filter.fields
      }
    }
  },
  'model.list.header': {
    data: ({ modelState, model }, { field }) => {
      const orders = modelState.filter.order
        , property = model.properties[field] || {}
      return {
        title: property.title || field,
        order: orders !== undefined ? (orders[field] || '') : ''
      }
    },
    method: {
      changeOrder: ({ dispatch, model, modelState }, { field }) => (order) => {
        const filter = modelState.filter
        const orders = filter.order || {}
        orders[field] = order

        dispatch({ model, type: 'GET_ITEMS', filter: { ...filter, order: orders } })
      }
    }
  },
  'model.list.row': {
    data: ({ modelState, model }, { item }) => {
      let selected = false
      for (let i of modelState.selected) {
        if (i.id === item.id) {
          selected = true
          break
        }
      }
      return { 
        selected
      }
    },
    compute: ({ model }, { item }) => {
      return {
        item: item,
        actions: model.item_actions,
        component: model.item_component,
        canEdit: !!model.permission && !!model.permission.edit && item._canEdit !== false,
        canDelete: !!model.permission && !!model.permission.delete && item._canDelete !== false
      }
    },
    method: {
      changeSelect: ({ dispatch, model }, { item }) => (selected) => {
        dispatch({ model, type: 'SELECT_ITEMS', item, selected })
      },
      editItem: ({ router, model }, { item }) => () => {
        router.push(`/model/${model.name}/${item.id}/edit`)
      },
      deleteItem: ({ dispatch, model }, { item }) => () => {
        dispatch({ model, type: 'DELETE_ITEM', item })
      }
    }
  },
  'model.list.item': {
    compute: ({ model }, { items, field, schema }) => {
      const property = schema || model.properties[field]
      const data = schema ? {} : { schema: property }
      if(model.fields_render == undefined) {
        model.fields_render = {}
      }
      if(model.fields_render[field] == undefined) {
        model.fields_render[field] = property != undefined ? 
          app.load_list('field_render').reduce((prev, render) => {
            return render(prev, property, field)
          }, null) : null
      }
      if(model.fields_render[field]) {
        data['componentClass'] = model.fields_render[field]
      }
      return data
    }
  },
  'model.list.actions': {
    data: ({ modelState }) => {
      return { count: modelState.selected.length }
    }
  },
  'model.list.btn.count': {
    data: ({ modelState }) => {
      return { count: modelState.count }
    }
  },
  'model.list.btn.cols': {
    data: ({ modelState, model }) => {
      return {
        selected: modelState.filter.fields,
        fields: model.properties
      }
    },
    method: {
      changeFieldDisplay: ({ dispatch, model, modelState }) => (e) => {
        const filter = modelState.filter
        const fields = [].concat(filter.fields || [])
        const field = e[0]
        const selected = e[1]
        const index = _.indexOf(fields, field)

        if (selected) {
          if (index === -1) fields.push(field)
        } else {
          _.remove(fields, (i) => { return i === field })
        }
        dispatch({ model, type: 'GET_ITEMS', filter: { ...filter, fields } })
      }
    }
  },
  'model.form': {
    data: ({ modelState, model }, { params }) => {
      return {
        loading: modelState.form.loading,
        item: params && params.id ? modelState.items[params.id] : undefined
      }
    },
    compute: ({ modelState, model }, { params, location: { query }, item }) => {
      return {
        ...modelState.form,
        id: params ? params.id : undefined,
        title: params && params.id ? `Edit ${model.title}` : `Create ${model.title}`,
        formKey: `model.${model.name}`,
        schema: model,
        data: item || (_.isEmpty(query) ? undefined : query)
      }
    },
    method: {
      getItem: ({ dispatch, model }) => (id) => {
        if(id) {
          dispatch({ model, type: 'GET_ITEM', id })
        }
      },
      updateItem: ({ dispatch, model }) => (item) => {
        return new Promise((resolve, reject) => {
          dispatch({ model, type: 'SAVE_ITEM', item, promise: { resolve, reject } })
        })
      }
    }
  }
}
