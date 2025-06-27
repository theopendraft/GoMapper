import React, { useState } from "react";
import { Village, ExtendedParent } from "../../data/types/village";
import { FiTrash2, FiEdit, FiSave, FiX } from "react-icons/fi";

type Props = {
  village: Village;
  onUpdate: (v: Village) => void;
};

export default function ParentVillageCard({ village, onUpdate }: Props) {
  const [localVillage, setLocalVillage] = useState<Village>({ ...village });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const updateParent = (index: number, updated: ExtendedParent) => {
    const updatedParents = [...(localVillage.parents || [])];
    updatedParents[index] = updated;
    setLocalVillage({ ...localVillage, parents: updatedParents });
  };

  const saveParent = () => {
    onUpdate(localVillage);
    setEditingIndex(null);
  };

  const removeParent = (index: number) => {
    const confirmed = window.confirm("Remove this parent?");
    if (!confirmed) return;
    const updated = [...(localVillage.parents || [])];
    updated.splice(index, 1);
    setLocalVillage({ ...localVillage, parents: updated });
    onUpdate({ ...localVillage, parents: updated });
  };

  const addNewParent = () => {
    const updated = [
      ...(localVillage.parents || []),
      { name: "", contact: "", lastInteraction: "", nextVisitTarget: "", notes: "" } as ExtendedParent,
    ];
    setLocalVillage({ ...localVillage, parents: updated });
    setEditingIndex(updated.length - 1);
    setExpanded(true);
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{village.name}</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:underline text-sm"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <>
          {(localVillage.parents || []).map((parent, index) => {
            const isEditing = editingIndex === index;
            const isValid = parent.name.trim() && parent.contact.trim();

            return (
              <div key={index} className="border rounded p-3 mb-2 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={parent.name}
                      onChange={(e) =>
                        updateParent(index, { ...parent, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full border p-2 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Contact</label>
                    <input
                      type="text"
                      value={parent.contact}
                      onChange={(e) =>
                        updateParent(index, { ...parent, contact: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full border p-2 rounded text-sm"
                    />
                  </div>
                </div>

                {isEditing && (
                  <>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Last Interaction</label>
                        <input
                          type="date"
                          value={parent.lastInteraction || ""}
                          onChange={(e) =>
                            updateParent(index, {
                              ...parent,
                              lastInteraction: e.target.value,
                            })
                          }
                          className="w-full border p-2 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Next Visit</label>
                        <input
                          type="date"
                          value={parent.nextVisitTarget || ""}
                          onChange={(e) =>
                            updateParent(index, {
                              ...parent,
                              nextVisitTarget: e.target.value,
                            })
                          }
                          className="w-full border p-2 rounded text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="text-sm font-medium">Notes</label>
                      <textarea
                        value={parent.notes || ""}
                        onChange={(e) =>
                          updateParent(index, {
                            ...parent,
                            notes: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full border p-2 rounded text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 mt-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveParent}
                        className={`px-4 py-1 rounded text-white text-sm ${
                          isValid
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!isValid}
                      >
                        <FiSave className="inline mr-1" /> Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        <FiX className="inline mr-1" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="px-3 py-1 text-sm text-blue-600 hover:underline"
                      >
                        <FiEdit className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => removeParent(index)}
                        className="px-3 py-1 text-sm text-red-600 hover:underline"
                      >
                        <FiTrash2 className="inline mr-1" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={addNewParent}
            className="mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Add Parent
          </button>
        </>
      )}
    </div>
  );
}
