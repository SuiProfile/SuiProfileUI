import { useEffect, useMemo, useRef, useState } from "react";
import { checkLink } from "../../app/services/linkService";
import storage from "../../app/utils/storage";
import type { LinkItem, LinkGroup } from "../../app/models/links";
import { loadInitialState, persistState, nextGroupId, nextLinkId, canAddLinkToGroup } from "../../app/services/linksStore";

type DragPayload = {
  linkId: string;
  from: 'library' | 'group';
  fromGroupId?: string;
};

const MAX_TITLE_LEN = 60;
const MAX_URL_LEN = 200;
const MAX_GROUP_LEN = 32;

export default function LinksPage() {
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [library, setLibrary] = useState<LinkItem[]>([]);

  const [newGroupName, setNewGroupName] = useState("");
  const [newTitle, setNewTitle] = useState(""); // text
  const [newUrl, setNewUrl] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  // URL başlangıcı http(s), alan adı ve zorunlu uzantı (.com, .net, .org vs) kontrol eder
  const urlRegex = /^https?:\/\/([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}(\/\S*)?$/i;
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  };

  // Load once from storage service
  useEffect(() => {
    const initial = loadInitialState();
    setGroups(initial.groups);
    setLibrary(initial.library);
    setNewGroupId(initial.groups[0]?.id ?? "");
  }, []);

  // Persist state
  useEffect(() => {
    persistState({ groups, library });
  }, [groups, library]);

  const groupOptions = useMemo(() => groups.map(g => ({ id: g.id, name: g.name })), [groups]);

  const groupIdCounter = useRef(1);

  // useEffect ile en başta mevcut grup id'lerine göre başlat
  useEffect(() => {
    groupIdCounter.current = parseInt(nextGroupId(groups), 10);
  }, []); // yalnızca ilk mount'ta çalışsın

  const addGroup = () => {
    const name = newGroupName.trim();
    if (groups.length >= 5) {
      showToast('En fazla 5 grup oluşturabilirsiniz');
      return;
    }
    if (!name) {
      showToast('Grup adı boş olamaz');
      return;
    }
    if (name.length < 2) {
      showToast('Grup adı en az 2 karakter olmalı');
      return;
    }
    const id = (groupIdCounter.current++).toString();
    setGroups(prev => [...prev, { id, name, links: [] }]);
    setNewGroupName("");
    if (!newGroupId) setNewGroupId(id);
    setAddingGroup(true);
    setTimeout(() => setAddingGroup(false), 600);
    showToast('Grup eklendi', 'success');
  };

  // Artan şekilde id'ler için bir sayaç tutuyoruz.
  // Bunu component seviyesinde ref olarak tutmak uygundur.
  const linkIdCounter = useRef(1);

  const getNextLinkId = () => {
    return (linkIdCounter.current++).toString();
  };

  // useEffect ile en başta mevcut id'lere göre başlat
  useEffect(() => {
    linkIdCounter.current = parseInt(nextLinkId(groups, library), 10);
  }, []); // sadece ilk mount'ta

  const addLink = async () => {
    const title = newTitle.trim();
    const url = newUrl.trim();
    if (!title) { showToast('Başlık boş olamaz'); return; }
    if (title.length < 2) { showToast('Başlık en az 2 karakter olmalı'); return; }
    if (!url) { showToast('URL boş olamaz'); return; }
    if (!urlRegex.test(url)) { showToast('URL https:// veya http:// ile başlamalı'); return; }
    setAddingLink(true);
    try {
      const res = await checkLink(url, { timeoutMs: 6000 });
      if (!res.reachable) {
        showToast(`Siteye ulaşılamadı${res.status ? ` (status ${res.status})` : res.error ? ` (${res.error})` : ''}`);
        return;
      }
      const normalized = res.normalizedUrl || url;
      if (library.some(l => l.url === normalized)) {
        showToast('Bu link zaten kütüphanede var');
        return;
      }
      const finalTitle = (title || res.title || '').toString().slice(0, MAX_TITLE_LEN) || normalized;
      const link: LinkItem = { id: getNextLinkId(), text: finalTitle, url: normalized };
      setLibrary(prev => [link, ...prev]);
      setNewTitle("");
      setNewUrl("");
      showToast('Link eklendi', 'success');
    } finally {
      setAddingLink(false);
    }
  };

  // DÜZELTME: localStorage'dan tüm grup anahtarını değil sadece link'i kaldır
  const removeLink = (groupId: string, linkId: string) => {
    setGroups(prev => {
      const nextGroups = prev.map(g =>
        g.id === groupId
          ? { ...g, links: g.links.filter(l => l.id !== linkId) }
          : g
      );
      // Güncellenmiş grupları localStorage'a persist et
      persistState({ groups: nextGroups, library });
      showToast('Link silindi', 'success');
      return nextGroups;
    });
  };

  // DÜZELTME: localStorage'dan sadece grup'u kaldır (ve persistState ile kalanları sakla)
  const removeGroup = (groupId: string) => {
    setGroups(prev => {
      const nextGroups = prev.filter(g => g.id !== groupId);
      // Güncellenmiş gruplar listesini localStorage'a kaydet
      persistState({ groups: nextGroups, library });
      if (newGroupId === groupId && nextGroups.length > 0) {
        setNewGroupId(nextGroups[0].id);
      } else if (nextGroups.length === 0) {
        setNewGroupId("");
      }
      // localStorage single-group anahtarı da silme fonksiyonu vardıysa, onu da sil
      storage.removeItem(groupId);
      showToast('Grup silindi', 'success');
      return nextGroups;
    });
  };

  const onDragStart = (e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOverGroup = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const onDropToGroup = (e: React.DragEvent, toGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    if (payload.from === 'library') {
      const link = library.find(l => l.id === payload.linkId);
      if (!link) return;
      copyLinkToGroup(toGroupId, link, undefined);
    } else {
      moveLink(payload.fromGroupId!, toGroupId, payload.linkId, undefined);
    }
  };

  const onDropBeforeIndex = (
    e: React.DragEvent,
    toGroupId: string,
    toIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    if (payload.from === 'library') {
      const link = library.find(l => l.id === payload.linkId);
      if (!link) return;
      copyLinkToGroup(toGroupId, link, toIndex);
    } else {
      moveLink(payload.fromGroupId!, toGroupId, payload.linkId, toIndex);
    }
  };

  const copyLinkToGroup = (toGroupId: string, link: LinkItem, toIndex?: number) => {
    setGroups(prev => {
      const nextGroups = prev.map(g => {
        if (g.id !== toGroupId) return g;
        // validations: max 10, no duplicate by URL
        const can = canAddLinkToGroup(g, link);
        if (!can.ok) {
          showToast(can.reason === 'max' ? 'Bu grupta en fazla 10 link olabilir' : 'Bu link zaten grupta var');
          return g;
        }
        // Yeni id: global sayaçtan üret
        const target = [...g.links];
        const newId = (linkIdCounter.current++).toString();
        const copy: LinkItem = { ...link, id: newId };
        const idx = toIndex === undefined ? target.length : Math.max(0, Math.min(toIndex, target.length));
        target.splice(idx, 0, copy);
        return { ...g, links: target };
      });
      persistState({ groups: nextGroups, library });
      return nextGroups;
    });
  };

  const moveLink = (
    fromGroupId: string,
    toGroupId: string,
    linkId: string,
    toIndex?: number
  ) => {
    if (!fromGroupId || !toGroupId || !linkId) return;
    setGroups(prev => {
      const fromGroup = prev.find(g => g.id === fromGroupId);
      const toGroup = prev.find(g => g.id === toGroupId);
      if (!fromGroup || !toGroup) return prev;
      const link = fromGroup.links.find(l => l.id === linkId);
      if (!link) return prev;

      // If same group, it's a reorder only
      if (fromGroupId === toGroupId) {
        const links = [...fromGroup.links];
        const currentIndex = links.findIndex(l => l.id === linkId);
        if (currentIndex === -1) return prev;
        const newIndex = toIndex === undefined ? links.length - 1 : Math.max(0, Math.min(toIndex, links.length - 1));
        const [moved] = links.splice(currentIndex, 1);
        links.splice(newIndex, 0, moved);
        const updated: LinkGroup = { ...fromGroup, links };
        const nextGroups = prev.map(g => (g.id === updated.id ? updated : g));
        persistState({ groups: nextGroups, library });
        return nextGroups;
      }

      // Target validations
      if (toGroup.links.length >= 10) {
        showToast('Bu grupta en fazla 10 link olabilir');
        return prev;
      }
      if (toGroup.links.some(l => l.url === link.url)) {
        showToast('Bu link zaten grupta var');
        return prev;
      }

      // remove from source
      const updatedFrom: LinkGroup = { ...fromGroup, links: fromGroup.links.filter(l => l.id !== linkId) };
      // insert into target
      const targetLinks = [...toGroup.links];
      const insertIndex = toIndex === undefined ? targetLinks.length : Math.max(0, Math.min(toIndex, targetLinks.length));
      targetLinks.splice(insertIndex, 0, link);
      const updatedTo: LinkGroup = { ...toGroup, links: targetLinks };
      const nextGroups = prev.map(g => (g.id === updatedFrom.id ? updatedFrom : g.id === updatedTo.id ? updatedTo : g));
      persistState({ groups: nextGroups, library });
      return nextGroups;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* Create section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 sm:p-6 mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Yeni Grup</h3>
          <div className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.currentTarget.value)}
              maxLength={MAX_GROUP_LEN}
              className={`flex-1 max-w-xs rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6] ${newGroupName && newGroupName.trim().length < 2 ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="Örn: Sosyal, İş, Kişisel"
              onKeyDown={(e) => { if (e.key === 'Enter') addGroup(); }}
            />
            <button
              type="button"
              onClick={addGroup}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)" }}
            >
              {addingGroup && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
              <span>Ekle</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-2">Yeni Link (kütüphaneye eklenir, gruplara sürükleyin)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-stretch">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.currentTarget.value)}
              maxLength={MAX_TITLE_LEN}
              className={`rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6] sm:max-w-sm ${newTitle && newTitle.trim().length < 2 ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="Başlık"
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.currentTarget.value)}
              maxLength={MAX_URL_LEN}
              className={`rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6] sm:max-w-md ${newUrl && !urlRegex.test(newUrl) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="https:// veya http://..."
              onKeyDown={(e) => { if (e.key === 'Enter' && urlRegex.test(newUrl)) addLink(); }}
            />
            <button
              type="button"
              onClick={addLink}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white h-10 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)" }}
            >
              {addingLink && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
              <span>Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Library + Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 py-4">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
        {/* Library (left) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Kütüphane</h4>
            <span className="text-xs text-gray-500">{library.length} link</span>
          </div>
          <ul className="flex flex-col gap-2">
            {library.map((link) => (
              <li key={link.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
                  draggable
                  onDragStart={(e) => onDragStart(e, { linkId: link.id, from: 'library' })}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" title={`id: ${link.id}`}>{link.text}</div>
                  <div className="text-xs text-gray-500 truncate">{link.url}</div>
                </div>
              </li>
            ))}
            {library.length === 0 && (
              <li className="text-xs text-gray-500">Henüz link eklenmedi.</li>
            )}
          </ul>
        </div>

        {/* Groups (right) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4"
            onDragOver={onDragOverGroup}
            onDrop={(e) => onDropToGroup(e, group.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold truncate pr-2">{group.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{group.links.length} link</span>
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  aria-label="Grubu sil"
                >
                  <i className="pi pi-trash text-xs" />
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {group.links.map((link, idx) => (
                <li key={link.id}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, { linkId: link.id, from: 'group', fromGroupId: group.id })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropBeforeIndex(e, group.id, idx)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className="pi pi-grip-vertical text-gray-400" />
                    <div className="truncate">
                      <div className="text-sm font-medium truncate" title={`id: ${link.id}`}>{link.text}</div>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-[#2665D6] hover:underline truncate block">{link.url}</a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(group.id, link.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >Sil</button>
                </li>
              ))}
              {/* Drop at end */}
              <li
                className="h-8 rounded-md border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-400"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropBeforeIndex(e, group.id, group.links.length)}
              >Bırak</li>
            </ul>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}


