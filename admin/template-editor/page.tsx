import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getSetting, setSetting } from '../../../utils/settings';

interface Block {
  id: string;
  type: 'html' | 'embed' | 'code';
  content: string;
  title: string;
}

interface Template {
  id: string;
  name: string;
  productName: string;
  productSpecs: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

function SortableBlock({ block, onUpdate, onDelete }: { block: Block; onUpdate: (id: string, content: string, title: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const [editTitle, setEditTitle] = useState(block.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(block.id, editContent, editTitle);
    setIsEditing(false);
  };

  const renderPreview = () => {
    switch (block.type) {
      case 'html':
        return (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
        );
      case 'embed':
        return (
          <div className="aspect-video">
            <iframe
              src={block.content}
              className="w-full h-full rounded-lg border-0"
              allowFullScreen
              title={block.title}
            />
          </div>
        );
      case 'code':
        return (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{block.content}</code>
          </pre>
        );
      default:
        return null;
    }
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case 'html':
        return 'ri-code-s-slash-line';
      case 'embed':
        return 'ri-link';
      case 'code':
        return 'ri-terminal-box-line';
      default:
        return 'ri-file-line';
    }
  };

  const getBlockLabel = () => {
    switch (block.type) {
      case 'html':
        return 'HTML 블록';
      case 'embed':
        return 'Embed 블록';
      case 'code':
        return 'Code 블록';
      default:
        return '블록';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <i className="ri-draggable text-xl"></i>
          </button>
          <div className="flex items-center gap-2">
            <i className={`${getBlockIcon()} text-lg text-teal-600`}></i>
            <span className="font-medium text-gray-700">{getBlockLabel()}</span>
          </div>
          {block.title && <span className="text-sm text-gray-500">- {block.title}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-teal-600 transition-colors"
          >
            <i className={`${isEditing ? 'ri-eye-line' : 'ri-edit-line'} text-lg`}></i>
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
          >
            <i className="ri-delete-bin-line text-lg"></i>
          </button>
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">블록 제목</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="블록 제목 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {block.type === 'html' && 'HTML 코드'}
                {block.type === 'embed' && 'Embed URL'}
                {block.type === 'code' && '코드 내용'}
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                placeholder={
                  block.type === 'html'
                    ? '<div>HTML 코드를 입력하세요</div>'
                    : block.type === 'embed'
                    ? 'https://www.youtube.com/embed/...'
                    : 'const example = "코드를 입력하세요";'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditContent(block.content);
                  setEditTitle(block.title);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">{renderPreview()}</div>
        )}
      </div>
    </div>
  );
}

export default function TemplateEditorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [productName, setProductName] = useState('');
  const [productSpecs, setProductSpecs] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const saved = await getSetting<Template[]>('product_templates');
    if (saved) {
      setTemplates(saved);
    }
  };

  const saveTemplates = (updatedTemplates: Template[]) => {
    setTemplates(updatedTemplates);
    setSetting('product_templates', updatedTemplates);
  };

  const addBlock = (type: 'html' | 'embed' | 'code') => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      title: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string, title: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, content, title } : block)));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateAutoDescription = () => {
    if (!productName) {
      alert('제품명을 입력해주세요.');
      return;
    }

    const autoBlocks: Block[] = [
      {
        id: `block-${Date.now()}-1`,
        type: 'html',
        title: '제품 소개',
        content: `<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
  <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 12px;">${productName}</h2>
  <p style="font-size: 16px; line-height: 1.6;">혁신적인 기술과 세련된 디자인이 만나 탄생한 ${productName}입니다. 최고의 품질과 성능을 경험하세요.</p>
</div>`,
      },
      {
        id: `block-${Date.now()}-2`,
        type: 'html',
        title: '주요 특징',
        content: `<div style="padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #14b8a6;">
  <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">주요 특징</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">
    <li style="padding: 8px 0; display: flex; align-items: center;">
      <span style="color: #14b8a6; margin-right: 8px;">✓</span>
      <span>뛰어난 성능과 안정성</span>
    </li>
    <li style="padding: 8px 0; display: flex; align-items: center;">
      <span style="color: #14b8a6; margin-right: 8px;">✓</span>
      <span>사용자 친화적인 인터페이스</span>
    </li>
    <li style="padding: 8px 0; display: flex; align-items: center;">
      <span style="color: #14b8a6; margin-right: 8px;">✓</span>
      <span>프리미엄 품질 보증</span>
    </li>
  </ul>
</div>`,
      },
    ];

    if (productSpecs) {
      autoBlocks.push({
        id: `block-${Date.now()}-3`,
        type: 'html',
        title: '제품 사양',
        content: `<div style="padding: 20px; background: white; border: 2px solid #e5e7eb; border-radius: 12px;">
  <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">제품 사양</h3>
  <div style="white-space: pre-line; line-height: 1.8; color: #4b5563;">${productSpecs}</div>
</div>`,
      });
    }

    setBlocks(autoBlocks);
  };

  const saveTemplate = () => {
    if (!templateName) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }

    const template: Template = {
      id: currentTemplate?.id || `template-${Date.now()}`,
      name: templateName,
      productName,
      productSpecs,
      blocks,
      createdAt: currentTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = currentTemplate
      ? templates.map((t) => (t.id === currentTemplate.id ? template : t))
      : [...templates, template];

    saveTemplates(updatedTemplates);
    setCurrentTemplate(template);
    setShowSaveModal(false);
    alert('템플릿이 저장되었습니다.');
  };

  const loadTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setProductName(template.productName);
    setProductSpecs(template.productSpecs);
    setBlocks(template.blocks);
    setShowLoadModal(false);
  };

  const deleteTemplate = (id: string) => {
    if (confirm('이 템플릿을 삭제하시겠습니까?')) {
      const updatedTemplates = templates.filter((t) => t.id !== id);
      saveTemplates(updatedTemplates);
      if (currentTemplate?.id === id) {
        setCurrentTemplate(null);
      }
    }
  };

  const newTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setProductName('');
    setProductSpecs('');
    setBlocks([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-lg">
                <i className="ri-file-edit-line text-xl text-teal-600"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">템플릿 편집기</h1>
                <p className="text-sm text-gray-500">제품 상세페이지 설명 자동 생성</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={newTemplate}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <i className="ri-file-add-line mr-2"></i>
                새 템플릿
              </button>
              <button
                onClick={() => setShowLoadModal(true)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <i className="ri-folder-open-line mr-2"></i>
                불러오기
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">제품 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="제품명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 사양</label>
                  <textarea
                    value={productSpecs}
                    onChange={(e) => setProductSpecs(e.target.value)}
                    rows={6}
                    placeholder="제품 사양을 입력하세요&#10;예: 크기, 무게, 재질 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={generateAutoDescription}
                  className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all whitespace-nowrap"
                >
                  <i className="ri-magic-line mr-2"></i>
                  자동 생성
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">블록 추가</h2>
              <div className="space-y-2">
                <button
                  onClick={() => addBlock('html')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left whitespace-nowrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-lg">
                      <i className="ri-code-s-slash-line text-lg text-orange-600"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">HTML 블록</div>
                      <div className="text-xs text-gray-500">커스텀 HTML 코드</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => addBlock('embed')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left whitespace-nowrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="ri-link text-lg text-blue-600"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Embed 블록</div>
                      <div className="text-xs text-gray-500">영상, 지도 등 임베드</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => addBlock('code')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left whitespace-nowrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                      <i className="ri-terminal-box-line text-lg text-purple-600"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Code 블록</div>
                      <div className="text-xs text-gray-500">코드 스니펫 표시</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">템플릿 미리보기</h2>
                <div className="text-sm text-gray-500">
                  {blocks.length}개 블록
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                    <i className="ri-layout-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 mb-2">블록이 없습니다</p>
                  <p className="text-sm text-gray-400">왼쪽에서 블록을 추가하거나 자동 생성을 사용하세요</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {blocks.map((block) => (
                        <SortableBlock key={block.id} block={block} onUpdate={updateBlock} onDelete={deleteBlock} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">템플릿 저장</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 이름</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="템플릿 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">템플릿 불러오기</h3>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">저장된 템플릿이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">
                        {template.productName} · {template.blocks.length}개 블록
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(template.updatedAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadTemplate(template)}
                        className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
