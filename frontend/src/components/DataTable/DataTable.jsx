import { useCallback, useEffect, useState } from 'react';

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  RedoOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button, Input, Select, Grid, Space } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import { useSelector, useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { selectListItems } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import { dataForTable } from '@/utils/dataStructure';
import { useMoney, useDate } from '@/settings';

import { generate as uniqueId } from 'shortid';

import { useCrudContext } from '@/context/crud';

function AddNewItem({ config }) {
  const { crudContextAction } = useCrudContext();
  const { collapsedBox, panel } = crudContextAction;
  const { ADD_NEW_ENTITY } = config;

  const handelClick = () => {
    panel.open();
    collapsedBox.close();
  };

  return (
    <Button onClick={handelClick} type="primary">
      {ADD_NEW_ENTITY}
    </Button>
  );
}
export default function DataTable({ config, extra = [] }) {
  let { entity, dataTableColumns, DATATABLE_TITLE, fields, searchConfig } = config;
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, modal, readBox, editBox, advancedBox } = crudContextAction;
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();

  const path = window.location.pathname;

  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const items = [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    ...extra,
    {
      type: 'divider',
    },

    {
      label: translate('Delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
    },
  ];

  const handleRead = (record) => {
    dispatch(crud.currentItem({ data: record }));
    panel.open();
    collapsedBox.open();
    readBox.open();
  };
  function handleEdit(record) {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    editBox.open();
    panel.open();
    collapsedBox.open();
  }
  function handleDelete(record) {
    dispatch(crud.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  }

  function handleUpdatePassword(record) {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    advancedBox.open();
    panel.open();
    collapsedBox.open();
  }

  let dispatchColumns = [];
  if (fields) {
    dispatchColumns = [...dataForTable({ fields, translate, moneyFormatter, dateFormat })];
  } else {
    dispatchColumns = [...dataTableColumns];
  }

  dataTableColumns = [
    ...dispatchColumns,
    {
      title: '',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
              switch (key) {
                case 'read':
                  handleRead(record);
                  break;
                case 'edit':
                  handleEdit(record);
                  break;

                case 'delete':
                  handleDelete(record);
                  break;
                case 'updatePassword':
                  handleUpdatePassword(record);
                  break;

                default:
                  break;
              }
              // else if (key === '2')handleCloseTask
            },
          }}
          trigger={['click']}
        >
          <EllipsisOutlined
            style={{ cursor: 'pointer', fontSize: '24px' }}
            onClick={(e) => e.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  const { pagination, items: dataSource } = listResult;

  const dispatch = useDispatch();

  const handelDataTableLoad = useCallback((pagination) => {
    const options = {
      page: pagination.current || 1,
      items: pagination.pageSize || 10,
      ...(path === '/query' ? { sortBy: 'created' } : {}),
    };
    dispatch(crud.list({ entity, options }));
  }, []);

  // Function to apply both filters
  const applyFilters = useCallback(() => {
    const options = {
      ...(searchValue && { q: searchValue, fields: searchConfig?.searchFields || '' }),
      ...(statusFilter && { filter: 'status', equal: statusFilter }),
    };
    dispatch(crud.list({ entity, options }));
  }, [searchValue, statusFilter, entity, searchConfig, dispatch]);

  const filterByStatus = (value) => {
    setStatusFilter(value);
  };

  const filterTable = (e) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  const dispatcher = (incomingOptions = {}) => {
    const opts = { ...incomingOptions };

    if (entity === 'query') {
      opts.page = 1;
      opts.items = 10;
      opts.sortBy = 'created';
    } else {
      opts.page = 1;
      opts.items = 10;
    }

    dispatch(crud.list({ entity, options: opts }));
  };

  const handleRefresh = () => {
    setSearchValue('');
    setStatusFilter(null);
    dispatcher();
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (searchValue !== '' || statusFilter !== null) {
      applyFilters();
    } else {
      dispatcher();
    }
  }, [searchValue, statusFilter, applyFilters]);

  const { useBreakpoint } = Grid;

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <>
      <PageHeader
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        title={DATATABLE_TITLE}
        ghost={false}
        extra={
          <Space
            direction={isMobile ? 'vertical' : 'horizontal'}
            size={8}
            style={{
              width: isMobile ? '100%' : undefined,
            }}
          >
            <Input
              key="searchFilter"
              value={searchValue}
              onChange={filterTable}
              placeholder={translate('search')}
              allowClear
              onClear={() => setSearchValue('')}
            />

            <Select
              key="statusFilter"
              placeholder="Filter by Status"
              allowClear
              style={{ width: isMobile ? '100%' : 150 }}
              value={statusFilter}
              onChange={filterByStatus}
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />

            <Button onClick={handleRefresh} key={uniqueId()} icon={<RedoOutlined />}>
              {translate('Refresh')}
            </Button>

            <AddNewItem key={uniqueId()} config={config} />
          </Space>
        }
        style={{ padding: '20px 0' }}
      />

      <Table
        columns={dataTableColumns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={pagination}
        loading={listIsLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: true }}
      />
    </>
  );
}
