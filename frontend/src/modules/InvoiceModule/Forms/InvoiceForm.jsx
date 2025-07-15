import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col, message, Space } from 'antd';

import { PlusOutlined, RobotOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import ItemRow from '@/modules/ErpPanelModule/ItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';
import { request } from '@/request';

export default function InvoiceForm({ subTotal = 0, current = null, form = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} formInstance={form} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null, formInstance = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);
  const [notesSummary, setNotesSummary] = useState('');
  console.log('notesSummary: ', notesSummary);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Try to get form instance if not provided as prop
  let form = formInstance;
  console.log('form: ', form);
  try {
    if (!form) {
      form = Form.useFormInstance();
    }
  } catch (error) {
    console.warn('Form instance not available:', error);
  }

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };

  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number, notesSummary = '' } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
      setNotesSummary(notesSummary);
    }
  }, [current]);

  useEffect(() => {
    if (form) {
      form.setFieldsValue({
        taxRate: taxRate * 100,
        year: currentYear,
        number: lastNumber,
        notesSummary: notesSummary,
      });
    }
  }, [notesSummary]);

  const generateSummary = async () => {
    console.log('Generate AI Summary clicked!'); // Debug log

    if (!form) {
      console.error('Form instance not available');
      message.error('Form not ready. Please try again.');
      return;
    }

    // Get current form values to extract item notes
    const formValues = form.getFieldsValue();
    console.log('Form values:', formValues); // Debug log

    const currentItems = formValues.items || [];
    console.log('Current items:', currentItems); // Debug log

    // Extract notes from current items
    const itemNotes = currentItems
      .map((item) => (item && item.notes ? item.notes.trim() : ''))
      .filter((note) => note.length > 0);

    console.log('Extracted notes:', itemNotes); // Debug log

    if (itemNotes.length === 0) {
      message.warning('No item notes found to summarize');
      return;
    }

    setGeneratingSummary(true);
    try {
      console.log('Making API call...'); // Debug log
      const response = await request.post({
        entity: `invoice/generateNotesSummary`,
        jsonData: {
          notes: itemNotes,
          invoiceId: current?._id || null,
        },
      });

      console.log('API response:', response); // Debug log

      if (response.success) {
        setNotesSummary(response.result.summary);
        message.success(`Summary generated successfully for ${response.result.noteCount} notes`);
      } else {
        message.error(response.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      message.error('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="client"
            label={translate('Client')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'draft'}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={5}>
          <p>{translate('Item')}</p>
        </Col>
        <Col className="gutter-row" span={7}>
          <p>{translate('Description')}</p>
        </Col>
        <Col className="gutter-row" span={3}>
          <p>{translate('Quantity')}</p>{' '}
        </Col>
        <Col className="gutter-row" span={4}>
          <p>{translate('Price')}</p>
        </Col>
        <Col className="gutter-row" span={5}>
          <p>{translate('Total')}</p>
        </Col>
      </Row>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <ItemRow key={field.key} remove={remove} field={field} current={current}></ItemRow>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      {/* Notes Summary Section */}
      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        <Col span={24}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}></h4>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={generateSummary}
              loading={generatingSummary}
            >
              Generate AI Summary
            </Button>
          </Space>
        </Col>
        <Col span={24}>
          <Form.Item label={translate('Notes Summary')} name="notesSummary">
            <Input.TextArea
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder="Summary of all item notes will appear here..."
              rows={4}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={10}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <SelectAsync
                value={taxRate}
                onChange={handelTaxChange}
                entity={'taxes'}
                outputValue={'taxValue'}
                displayLabels={['taxName']}
                withRedirect={true}
                urlToRedirect="/taxes"
                redirectLabel={translate('Add New Tax')}
                placeholder={translate('Select Tax Value')}
              />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
    </>
  );
}
