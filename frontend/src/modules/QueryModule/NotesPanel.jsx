import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Input, 
  Form, 
  message, 
  Popconfirm, 
  Typography, 
  Space,
  Avatar,
  Tooltip 
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectCurrentItem } from '@/redux/crud/selectors';
import { request } from '@/request';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

function NotesPanel({ config }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [form] = Form.useForm();
  
  const { result: currentItem } = useSelector(selectCurrentItem);
  const entity = config.entity;

  // Load notes when currentItem changes
  useEffect(() => {
    if (currentItem && currentItem._id) {
      loadNotes();
    }
  }, [currentItem]);

  const loadNotes = async () => {
    if (!currentItem?._id) return;
    
    try {
      setLoading(true);
      const response = await request.read({ entity, id: currentItem._id });
      if (response.success && response.result.notes) {
        setNotes(response.result.notes);
      }
    } catch (error) {
      message.error('Failed to load notes');
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (values) => {
    if (!currentItem?._id) return;
    
    try {
      setAddingNote(true);
      const url = `/${entity}/${currentItem._id}/addNote`;
      const response = await request.post({
        entity: url,
        jsonData: values
      });
      
      if (response.success) {
        message.success('Note added successfully');
        form.resetFields();
        await loadNotes(); // Reload notes
      } else {
        message.error(response.message || 'Failed to add note');
      }
    } catch (error) {
      message.error('Failed to add note');
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const editNote = async (noteId, content) => {
    console.log('editNote called with noteId:', noteId);
    console.log('content:', content);
    console.log('currentItem._id:', currentItem?._id);
    console.log('entity:', entity);
    
    if (!currentItem?._id || !noteId) return;
    
    try {
      setSavingEdit(true);
      const entityUrl = `${entity}/${currentItem._id}/editNote/${noteId}`;
      console.log('Constructed entity URL:', entityUrl);
      
      const response = await request.patch({
        entity: entityUrl,
        jsonData: { content }
      });
      
      if (response.success) {
        message.success('Note updated successfully');
        setEditingNoteId(null);
        setEditingContent('');
        await loadNotes(); // Reload notes
      } else {
        message.error(response.message || 'Failed to update note');
      }
    } catch (error) {
      message.error('Failed to update note');
      console.error('Error updating note:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteNote = async (noteId) => {
    console.log('deleteNote called with noteId:', noteId);
    console.log('currentItem._id:', currentItem?._id);
    console.log('entity:', entity);
    if (!currentItem?._id) return;
    
    try {
      // Use the custom delete method for the removeNote endpoint
      const entityUrl = `${entity}/${currentItem._id}/removeNote/${noteId}`;
      console.log('Constructed entity URL:', entityUrl);
      
      const response = await request.deleteCustom({
        entity: entityUrl
      });
      
      if (response.success) {
        message.success('Note deleted successfully');
        await loadNotes(); // Reload notes
      } else {
        message.error(response.message || 'Failed to delete note');
      }
    } catch (error) {
      message.error('Failed to delete note');
      console.error('Error deleting note:', error);
    }
  };

  const startEdit = (note) => {
    setEditingNoteId(note._id);
    setEditingContent(note.content);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const saveEdit = async () => {
    if (!editingContent.trim()) {
      message.warning('Note content cannot be empty');
      return;
    }
    
    await editNote(editingNoteId, editingContent);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!currentItem?._id) {
    return (
      <Card title="Notes" style={{ marginTop: 16 }}>
        <Text type="secondary">Select a query to view notes</Text>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <span>Notes</span>
          <Text type="secondary">({notes.length})</Text>
        </Space>
      } 
      style={{ marginTop: 16 }}
    >
      {/* Add Note Form */}
      <Form form={form} onFinish={addNote} style={{ marginBottom: 16 }}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Please enter note content' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Add a note..." 
            disabled={addingNote}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<PlusOutlined />}
            loading={addingNote}
            size="small"
          >
            Add Note
          </Button>
        </Form.Item>
      </Form>

      {/* Notes List */}
      <List
        loading={loading}
        dataSource={notes}
        locale={{ emptyText: 'No notes yet' }}
        renderItem={(note) => (
          <List.Item
            actions={[
              // Edit button
              <Tooltip title="Edit note">
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => startEdit(note)}
                  disabled={editingNoteId === note._id}
                  style={{ 
                    color: editingNoteId === note._id ? '#d9d9d9' : '#1890ff' 
                  }}
                />
              </Tooltip>,
              // Delete button
              <Tooltip title="Delete note">
                <Popconfirm
                  title="Are you sure you want to delete this note?"
                  onConfirm={() => deleteNote(note._id)}
                  okText="Yes"
                  cancelText="No"
                  disabled={editingNoteId === note._id}
                >
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    size="small"
                    danger
                    disabled={editingNoteId === note._id}
                  />
                </Popconfirm>
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} size="small" />}
              title={
                <Space>
                  <Text strong>
                    {currentItem.createdBy?.name || 'Unknown User'}
                  </Text>
                  {note.createdAt && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <CalendarOutlined /> {formatDate(note.createdAt)}
                    </Text>
                  )}
                </Space>
              }
              description={
                editingNoteId === note._id ? (
                  // Edit mode
                  <div style={{ marginTop: 8 }}>
                    <TextArea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      style={{ marginBottom: 8 }}
                      placeholder="Edit note content..."
                    />
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        loading={savingEdit}
                        onClick={saveEdit}
                        disabled={!editingContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={cancelEdit}
                        disabled={savingEdit}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </div>
                ) : (
                  // View mode
                  <Paragraph 
                    style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                    ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                  >
                    {note.content}
                  </Paragraph>
                )
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

export default NotesPanel;