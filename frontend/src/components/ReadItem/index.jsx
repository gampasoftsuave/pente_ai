import { useEffect, useState } from 'react';
import { Row, Col } from 'antd';
import { useSelector } from 'react-redux';

import dayjs from 'dayjs';
import { dataForRead } from '@/utils/dataStructure';

import { useCrudContext } from '@/context/crud';
import { selectCurrentItem } from '@/redux/crud/selectors';
import { valueByString } from '@/utils/helpers';

import useLanguage from '@/locale/useLanguage';
import { useDate } from '@/settings';

export default function ReadItem({ config }) {
  const { dateFormat } = useDate();
  let { readColumns, fields } = config;
  const translate = useLanguage();
  const { result: currentResult } = useSelector(selectCurrentItem);
  const { state } = useCrudContext();
  const { isReadBoxOpen } = state;
  const [listState, setListState] = useState([]);

  if (fields) readColumns = [...dataForRead({ fields: fields, translate: translate })];
  
  // If config has readColumns with render functions, use those instead
  if (config.readColumns) {
    readColumns = config.readColumns;
  }
  
  useEffect(() => {
    const list = [];
    console.log('ReadItem - readColumns:', readColumns);
    console.log('ReadItem - currentResult:', currentResult);
    
    readColumns.map((props) => {
      const propsKey = props.dataIndex;
      const propsTitle = props.title;
      const isDate = props.isDate || false;
      let value = valueByString(currentResult, propsKey);
      
      console.log(`ReadItem - Processing ${propsKey}:`, value, 'has render:', !!props.render);
      
      // Apply custom render function if it exists
      if (props.render && typeof props.render === 'function') {
        console.log(`ReadItem - Applying render function for ${propsKey}`);
        value = props.render(value);
        console.log(`ReadItem - After render for ${propsKey}:`, value);
      } else {
        value = isDate ? dayjs(value).format(dateFormat) : value;
      }
      
      list.push({ propsKey, label: propsTitle, value: value });
    });
    console.log('list: ', list);
    setListState(list);
  }, [currentResult, readColumns]);

  const show = isReadBoxOpen ? { display: 'block', opacity: 1 } : { display: 'none', opacity: 0 };

  const itemsList = listState.map((item) => {
    return (
      <Row key={item.propsKey} gutter={12}>
        <Col className="gutter-row" span={8}>
          <p>{item.label}</p>
        </Col>
        <Col className="gutter-row" span={2}>
          <p> : </p>
        </Col>
        <Col className="gutter-row" span={14}>
          <p>{item.value}</p>
        </Col>
      </Row>
    );
  });

  return <div style={show}>{itemsList}</div>;
}
