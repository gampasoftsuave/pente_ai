export const fields = {
  customerName: {
    type: 'string',
    required: true,
  },
  description: {
    type: 'textarea',
    required: true,
  },
  status: {
    type: 'select',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'InProgress', label: 'In Progress' },
      { value: 'Closed', label: 'Closed' },
    ],
    required: true,
  },
  priority: {
    type: 'select',
    options: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
      { value: 'Critical', label: 'Critical' },
    ],
  },
  category: {
    type: 'string',
  },
  notes: {
    type: 'notes',
    label: 'Notes',
  },
  resolution: {
    type: 'textarea',
  },
};

export const readFields = {
  customerName: {
    type: 'string',
    label: 'Customer Name',
  },
  description: {
    type: 'string',
    label: 'Description',
  },
  status: {
    type: 'tag',
    label: 'Status',
    options: [
      { value: 'Open', label: 'Open', color: 'blue' },
      { value: 'InProgress', label: 'In Progress', color: 'orange' },
      { value: 'Closed', label: 'Closed', color: 'green' },
    ],
  },
  category: {
    type: 'string',
    label: 'Category',
  },
  notes: {
    type: 'array',
    label: 'Notes',
    render: (notes) => {
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return 'No notes';
      }
      return notes.map(note => note.content || note).join(', ');
    },
  },
  resolution: {
    type: 'string',
    label: 'Resolution',
  },
  created: {
    type: 'date',
    label: 'Created',
  },
  updated: {
    type: 'date',
    label: 'Updated',
  },
};

export const dataTableColumns = [
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (text) => text?.length > 50 ? `${text.substring(0, 50)}...` : text,
  },
   {
    title: 'Created Date',
    dataIndex: 'created',
    key: 'created',
    render: (date) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    renderType: 'status',
  },
  {
    title: 'Resolution',
    dataIndex: 'resolution',
    key: 'resolution',
    render: (text) => text?.length > 30 ? `${text.substring(0, 30)}...` : text || 'N/A',
  },
];
