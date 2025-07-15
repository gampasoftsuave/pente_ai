import QueryModule from '@/modules/QueryModule/QueryModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields, readFields, dataTableColumns } from './config';
import { Tag } from 'antd';

import useLanguage from '@/locale/useLanguage';

export default function Query() {
  const translate = useLanguage();
  const entity = 'query';
  
  const searchConfig = {
    displayLabels: ['customerName', 'description'],
    searchFields: 'customerName,description,status',
  };
  
  const deleteModalLabels = ['customerName', 'description'];

  // Add custom render functions to read fields
  const enhancedReadFields = Object.keys(readFields).reduce((acc, key) => {
    const field = readFields[key];
    
    if (field.renderType === 'customerObject') {
      acc[key] = {
        ...field,
        render: (value) => {
          
          // Handle different value types
          if (value === null || value === undefined) {
            return 'No Customer';
          }
          
          if (typeof value === 'string') {
            return value;
          }
          
          if (typeof value === 'object') {
            // If it's a populated customer object
            if (value.name) {
              return value.name;
            }
            // If it's just an ObjectId
            if (value._id) {
              return `Customer: ${value._id}`;
            }
            // If it's some other object, try to stringify it for debugging
            return JSON.stringify(value);
          }
          
          return String(value);
        },
      };
    } else if (field.renderType === 'userObject') {
      acc[key] = {
        ...field,
        render: (value) => {
          
          if (value === null || value === undefined) {
            return 'Unassigned';
          }
          
          if (typeof value === 'string') {
            return value;
          }
          
          if (typeof value === 'object') {
            if (value.name) {
              return `${value.name}${value.surname ? ' ' + value.surname : ''}`;
            }
            if (value._id) {
              return `User: ${value._id}`;
            }
            return JSON.stringify(value);
          }
          
          return String(value);
        },
      };
    } else {
      acc[key] = field;
    }
    
    return acc;
  }, {});

  // Add custom render functions to columns
  const enhancedColumns = dataTableColumns.map(column => {
    if (column.renderType === 'status') {
      return {
        ...column,
        render: (status) => {
          const colors = {
            Open: 'blue',
            InProgress: 'orange', 
            Closed: 'green',
          };
          return (
            <Tag color={colors[status] || 'default'}>
              {status === 'InProgress' ? 'In Progress' : status}
            </Tag>
          );
        },
      };
    }
    
    if (column.renderType === 'priority') {
      return {
        ...column,
        render: (priority) => {
          const colors = {
            Low: 'default',
            Medium: 'blue',
            High: 'orange',
            Critical: 'red',
          };
          return (
            <Tag color={colors[priority] || 'default'}>
              {priority}
            </Tag>
          );
        },
      };
    }
    
    if (column.renderType === 'customerInfo') {
      return {
        ...column,
        render: (customer) => {
          if (typeof customer === 'object' && customer?.name) {
            return customer.name;
          }
          return customer || 'Unknown';
        },
      };
    }
    
    return column;
  });

  const Labels = {
    PANEL_TITLE: translate('Query Management'),
    DATATABLE_TITLE: translate('Query List'),
    ADD_NEW_ENTITY: translate('Add New Query'),
    ENTITY_NAME: translate('Query'),
  };
  
  const configPage = {
    entity,
    ...Labels,
  };
  
  const config = {
    ...configPage,
    // fields: enhancedReadFields, // Don't pass fields to force DataTable to use dataTableColumns
    readColumns: Object.keys(enhancedReadFields).map(key => {
      const field = enhancedReadFields[key];
      return {
        title: field.label || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        dataIndex: key,
        render: field.render || ((value) => value),
        isDate: field.type === 'date',
      };
    }),
    dataTableColumns: enhancedColumns,
    searchConfig,
    deleteModalLabels,
  };
  
  return (
    <QueryModule
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
  );
}
