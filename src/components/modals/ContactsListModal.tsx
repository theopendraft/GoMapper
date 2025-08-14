import React, { useState, useEffect } from "react";
import { Village } from "../../types/village";
import { ExtendedParent } from "../../types/parent";
import { FiTrash2, FiEdit, FiSave, FiX, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  village: Village;
  onUpdate: (v: Village) => void;
  onClose: () => void;
};

export default function ContactsListModal({
  village,
  onUpdate,
  onClose,
}: Props) {
  const [localVillage, setLocalVillage] = useState<Village>({ ...village });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalVillage({ ...village });
  }, [village]);

  const updateParent = (index: number, updated: ExtendedParent) => {
    const updatedParents = [...(localVillage.parents || [])];
    updatedParents[index] = updated;
    setLocalVillage({ ...localVillage, parents: updatedParents });
  };

  const saveParent = (index: number) => {
    onUpdate(localVillage);
    setEditingIndex(null);
  };

  const removeParent = (index: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this contact?"
    );
    if (!confirmed) return;
    const updatedParents = [...(localVillage.parents || [])];
    updatedParents.splice(index, 1);
    const updatedVillage = { ...localVillage, parents: updatedParents };
    setLocalVillage(updatedVillage);
    onUpdate(updatedVillage);
  };

  const addNewParent = () => {
    const newParent: ExtendedParent = {
      name: "",
      contact: "",
      lastInteraction: "",
      nextVisitTarget: "",
      notes: "",
    };
    const updatedParents = [...(localVillage.parents || []), newParent];
    setLocalVillage({ ...localVillage, parents: updatedParents });
    setEditingIndex(updatedParents.length - 1);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-white rounded-xl shadow-2xl w-full  sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col "
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {village.name} - Contacts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-2"
          >
            <FiX size={24} />
          </button>
        </header>

        <main className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <AnimatePresence>
            {(localVillage.parents || []).map((parent, index) => {
              const isEditing = editingIndex === index;
              const isValid = parent.name.trim() && parent.contact.trim();

              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border rounded-xl p-3 sm:p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Name
                      </label>
                      <input
                        type="text"
                        value={parent.name}
                        onChange={(e) =>
                          updateParent(index, {
                            ...parent,
                            name: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="w-full mt-1 border p-2 rounded-lg text-sm bg-white disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Contact
                      </label>
                      <input
                        type="text"
                        value={parent.contact}
                        onChange={(e) =>
                          updateParent(index, {
                            ...parent,
                            contact: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="w-full mt-1 border p-2 rounded-lg text-sm bg-white disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Last Interaction
                          </label>
                          <input
                            type="date"
                            value={parent.lastInteraction || ""}
                            onChange={(e) =>
                              updateParent(index, {
                                ...parent,
                                lastInteraction: e.target.value,
                              })
                            }
                            className="w-full mt-1 border p-2 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Next Visit Target
                          </label>
                          <input
                            type="date"
                            value={parent.nextVisitTarget || ""}
                            onChange={(e) =>
                              updateParent(index, {
                                ...parent,
                                nextVisitTarget: e.target.value,
                              })
                            }
                            className="w-full mt-1 border p-2 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Notes
                        </label>
                        <textarea
                          value={parent.notes || ""}
                          onChange={(e) =>
                            updateParent(index, {
                              ...parent,
                              notes: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full mt-1 border p-2 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 mt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveParent(index)}
                          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-semibold transition-colors ${
                            isValid
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!isValid}
                        >
                          <FiSave /> Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm border rounded-lg hover:bg-gray-100"
                        >
                          <FiX /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => removeParent(index)}
                          className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {localVillage.parents?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No contacts found for this location.</p>
              <p>Click 'Add New Contact' to get started.</p>
            </div>
          )}
  


          <button
            onClick={addNewParent}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
          >
            <FiPlus /> Add New Contact
          </button>
      </main>
      </motion.div>
    </div>
  );
}
