import React, { useState, useEffect, useRef, useCallback } from 'react';
import SplitPane from "react-split-pane";

// PDF Viewer Core
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Default Layout Plugin
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Search Plugin
import { searchPlugin } from '@react-pdf-viewer/search';


// Download Plugin
import { getFilePlugin } from '@react-pdf-viewer/get-file';

const App = () => {
    /* ---------------------------- Search component ---------------------------- */
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [neural, setNeural] = useState(false); // default to neural search
    const [top, setTop] = useState(5);


    /* ------------------------- Exaned click component ------------------------- */
    const titleRefs = useRef([]);
    const sourceRefs = useRef([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const encodedFileName = selectedItem ? encodeURIComponent(selectedItem.payload.location) : '';
    const [titleOverflowingList, setTitleOverflowingList] = useState([]);
    const [sourceOverflowingList, setSourceOverflowingList] = useState([]);


    /* -------------------------------------------------------------------------- */
    /*                                     PDF                                    */
    /* -------------------------------------------------------------------------- */
    /* -------------------------------- Highlight ------------------------------- */
    const searchPluginInstance = searchPlugin({
        keyword: [query],
        onHighlightKeyword: (props) => {
            props.highlightEle.style.outline = '0.1rem solid rgb(255 243 7 / 45%)';
            props.highlightEle.style.backgroundColor = 'rgb(255 243 7 / 45%)';
            props.highlightEle.style.borderRadius = '0.05rem';
        },
    }, [query]);
    /* -------------------------------- Download -------------------------------- */
    const getFilePluginInstance = getFilePlugin({
        fileNameGenerator: (file) => {
            const fileName = file.name.substring(file.name.lastIndexOf('/') + 1);
            return fileName; 
        },
    }, [selectedItem]);
    const { DownloadButton } = getFilePluginInstance;
    /* --------------------------------- Toolbar -------------------------------- */
    const renderToolbar = (Toolbar) => (
        <Toolbar>
            {(slots) => {
                const {
                    CurrentPageInput,
                    EnterFullScreen,
                    GoToNextPage,
                    GoToPreviousPage,
                    NumberOfPages,
                    Zoom,
                    ZoomIn,
                    ZoomOut,
                } = slots;
                return (
                    <div className='toolbar'>
                        {/* Render toolbar only if selectedItem exists */}
                        {selectedItem && (
                            <>
                                <div className='toolbar-page'>
                                    <div>
                                        <GoToPreviousPage />
                                    </div>
                                    <div className='toolbar-page-number'>
                                        <CurrentPageInput /> / <NumberOfPages />
                                    </div>
                                    <div>
                                        <GoToNextPage />
                                    </div>
                                </div>
                                <div className='toolbar-zoom'>
                                    <div style={{ padding: '0px 2px' }}>
                                        <ZoomOut />
                                    </div>
                                    <div style={{ padding: '0px 2px' }}>
                                        <Zoom />
                                    </div>
                                    <div style={{ padding: '0px 2px' }}>
                                        <ZoomIn />
                                    </div>
                                </div>
                                <div className='toolbar-download'>
                                    <div style={{ padding: '0px 2px', marginLeft: 'auto' }}>
                                        <EnterFullScreen />
                                    </div>
                                    <div style={{ padding: '0px 2px' }}>
                                        <DownloadButton />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            }}
        </Toolbar>
    );
    /* ----------------------------- Default Layout ----------------------------- */
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        renderToolbar,
        sidebarTabs: (defaultTabs) => [],
    }, [selectedItem, query]);

    /* --------------------------------- Search --------------------------------- */
    const handleSearch = useCallback(async (q) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(q)}&neural=${neural}&top=${top}`);
            const data = await response.json();
            setResults(data.result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [neural, top]); 
    
    useEffect(() => {
        setSelectedItem(null);
        const delayDebounce = setTimeout(() => {
            if (query.trim()) {
                handleSearch(query);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [query, handleSearch]);
    
    useEffect(() => {
        setSelectedItem(null);
        handleSearch(query); 
    }, [query, neural, handleSearch]);
    


    /* ------------------------------ Expand click ------------------------------ */
    const handleExpandClick = (item) => {
        if (selectedItem === item) {
          setSelectedItem(null);
        } else {
          setSelectedItem(item);
        }
    };
    useEffect(() => {
        const checkOverflow = (refs) =>
            refs.map((ref) => ref && ref.scrollWidth > ref.offsetWidth);
        setTitleOverflowingList(checkOverflow(titleRefs.current));
        setSourceOverflowingList(checkOverflow(sourceRefs.current));
    }, [results]);

    return (
        <SplitPane split="horizontal" minSize={100} maxSize={-100} defaultSize="7%">
            {/* Header Panel */}
            <div className="nav-bar">
                <span className="text-logo">SearchFile</span>
            </div>

            <SplitPane split="vertical" minSize={100} maxSize={-100} defaultSize="60%">
                {/* Left Panel */}
                <div className="left-pane">
                    <div className="search-container">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Enter search term..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="search-input"
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                        <div className="checkbox-container">
                            <label className="checkbox-element">
                                <input
                                type="checkbox"
                                checked={neural}
                                onChange={() => setNeural(!neural)}
                                />
                            </label>
                            <span className="label-right">Nural Search</span>
                        </div>
                        {/* TODO Top */}
                        {/* <input
                            type="number"
                            value={top}
                            onChange={() => setTop(!top)}
                        /> */}
                    </div>
                    <div className="hidden-scrollbar">
                        <ul>
                            {results.map((item, index) => (
                            <li
                                key={index}
                                onClick={() => handleExpandClick(item)}
                                className={`result-item ${selectedItem === item ? 'expanded' : ''}`}
                            >
                                <div className="grid">
                                    <span className="title g s1">
                                        <span
                                        className={`one-line ${titleOverflowingList[index] ? "scrollable" : ""}`}
                                        ref={(el) => (titleRefs.current[index] = el)}
                                        >
                                        <span>{item.payload.file_name}</span>
                                        </span>
                                    </span>
                                    <span className="source g s4">
                                        <span
                                        className={`one-line ${sourceOverflowingList[index] ? "scrollable" : ""}`}
                                        ref={(el) => (sourceRefs.current[index] = el)}
                                        >
                                        <span>
                                            {/* if not working, using encodedFileName */}
                                            <a href={`http://localhost:9000/document/${item.payload.location}#page=${item.payload.page}`} target="_blank" rel="noopener noreferrer">
                                            {`http://localhost:9000/document/${item.payload.location}#page=${item.payload.page}`}
                                            </a>
                                        </span> 
                                        </span>
                                    </span>
                                    <span className="divider g s2"></span>
                                    <span className="content g s3">
                                        <span>
                                        Page {item.payload.page}
                                        </span>
                                        <span style={{ color: "#CB3737", fontWeight: "400", fontSize: "0.8rem" }}>
                                        (Score: {typeof item.score === 'number' ? item.score.toFixed(2) : item.score})
                                        </span>
                                    </span>
                                    {selectedItem === item && (
                                        <div className="g s5 detail-content">
                                            {/* Detail Content */}
                                            <div className="detail-item-row1">
                                                <div className="detail-item" style={{ display: "flex", alignItems: "center" }}>
                                                    <strong>Modified By:</strong><img src={item.payload.modified_profile} onError={(e) => (e.target.src = "/default-profile.png")} alt="Modified" className="profile-image" /> <a href={`mailto:${item.payload.modified_by_email}`}>{item.payload.modified_by_name}</a>
                                                </div>
                                                <div className="detail-item">
                                                    <strong style={{ marginRight: "0.3rem" }}>Modified Date:</strong> {new Date(item.payload.created_date).toLocaleString('th-TH', {hour12: false})}
                                                </div>
                                            </div>
                                            <div className="detail-item-row2">
                                                <div className="detail-item" style={{ display: "flex", alignItems: "center" }}>
                                                    <strong style={{ marginRight: "0.8rem" }}>Author By:</strong><img src={item.payload.author_profile} onError={(e) => (e.target.src = "/default-profile.png")} alt="Author" className="profile-image" /> <a href={`mailto:${item.payload.author_email}`}>{item.payload.author_name}</a>
                                                </div>
                                                <div className="detail-item">
                                                    <strong style={{ marginRight: "0.3rem" }}>Created Date:</strong> {new Date(item.payload.uploaded_date).toLocaleString('th-TH', {hour12: false})}
                                                </div>
                                            </div>
                                            <div className="detail-item-row3" style={{ width: "100%" }}>
                                                <div className="detail-item" style={{ width: "70%", marginRight: "1rem" }}>
                                                    <strong>Location:</strong> {item.payload.location}
                                                </div>
                                                <div className="detail-item" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                        <strong style={{ marginRight: "0.5rem" }}>File Size:</strong> {Math.round(item.payload.size / 1024 / 1024)} MB
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                        <strong style={{ marginRight: "0.5rem" }}>File Type:</strong> {item.payload.filetype.split("/")[1]}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Panel: PDF Viewer */}
                {selectedItem ? (
                    <div className="right-pane">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.js">
                            <Viewer
                                fileUrl={`http://localhost:9000/document/${selectedItem.payload.location}`}
                                plugins={[defaultLayoutPluginInstance, searchPluginInstance, getFilePluginInstance]}
                                defaultScale={1}
                                initialPage={selectedItem.payload.page - 1}
                            />
                        </Worker>
                    </div>
                ) : (
                    <div className="right-pane" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <p>Click on an item to see details here.</p>
                    </div>
                )}
            </SplitPane>
        </SplitPane>
    );
};

export default App;
