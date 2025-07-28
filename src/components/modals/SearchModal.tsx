// // // src/components/modals/SearchModal.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import { FiX, FiSearch, FiCheckCircle } from 'react-icons/fi'; // For icons

// interface SearchModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   // New prop: a callback to signal that the user wants to start a search
//   // The actual search input will be dynamically rendered into the map context
//   onStartSearch: () => void;
//   // Prop to indicate if a location has been found and is awaiting selection
//   locationFoundForSelection: { lat: number; lng: number; address: string } | null;
//   onClearLocationFound: () => void; // To clear the "Location selected on map" message
// }

// const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onStartSearch, locationFoundForSelection, onClearLocationFound }) => {
//   const [showInstructions, setShowInstructions] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       // Small delay to allow the search control to render on the map
//       const timer = setTimeout(() => {
//         setShowInstructions(true);
//       }, 300); // Adjust delay if needed
//       return () => clearTimeout(timer);
//     } else {
//       setShowInstructions(false);
//       onClearLocationFound(); // Clear message when modal closes
//     }
//   }, [isOpen, onClearLocationFound]);

//   if (!isOpen) return null;

//   return (
//     <div > {/* <div className="bg-white rounded-lg shadow-xl w-full max-w-xl h-auto min-h-[250px] flex flex-col overflow-hidden">
// //         <div className="flex justify-between items-center p-4 border-b border-gray-200">
// //           <h2 className="text-xl font-semibold text-gray-800">Search Location on Map</h2>
// //           <button
// //             onClick={onClose}
// //             className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
// //             aria-label="Close search modal"
// //           >
// //             <FiX className="w-6 h-6" />
// //           </button>
// //         </div>
// //         <div className="p-4 flex-grow flex flex-col justify-center items-center">
// //             <p className="text-center text-gray-700 mb-4 text-lg">
// //                 The search bar will appear directly on the map.
// //             </p>
// //             {showInstructions && (
// //               <p className="text-center text-gray-600 mb-4">
// //                   Type your desired location into the search bar that appears on the map.
// //                   <br />
// //                   **Click on the temporary marker** that appears on the map to select it.
// //               </p>
// //             )}

// //             {!locationFoundForSelection && (
// //                 <button
// //                     onClick={() => {
// //                         onStartSearch(); // Signal Map.tsx to show search control
// //                         setShowInstructions(true); // Show instructions after clicking
// //                     }}
// //                     className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-lg font-medium"
// //                 >
// //                     <FiSearch className="mr-2" /> Start Map Search
// //                 </button>
// //             )}

// //             {locationFoundForSelection && (
// //                 <div className="text-center mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md flex items-center justify-center">
// //                     <FiCheckCircle className="mr-2 w-5 h-5" /> Location found and ready for selection on map!
// //                 </div>
// //             )}
// //         </div>
// //         <div className="p-4 border-t border-gray-200 text-sm text-gray-600 text-center">
// //             Close this modal to hide the search bar on the map.
// //         </div>
// //       </div> */}
//      </div>
//    );
// };

//  export default SearchModal;