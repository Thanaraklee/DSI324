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

// Multi Selectbox
import ReactMultiSelectCheckboxes from 'react-multiselect-checkboxes';


const App = () => {
    /* ---------------------------- Search component ---------------------------- */
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [neural, setNeural] = useState(false); // default to neural search
   
    /* ---------------------------- Top Limit Search ---------------------------- */
    const [top, setTop] = useState(5);
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            const newTop = parseInt(event.target.value, 10);
            if (!isNaN(newTop)) {
                console.log("New top value:", newTop); 
                setTop(newTop);
            }
        }
    };
    /* ------------------------------ Faculty list ------------------------------ */
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculties, setSelectedFaculties] = useState([]);
    const [expandedFaculties, setExpandedFaculties] = useState({});

    useEffect(() => {
        fetch('http://localhost:8000/api/faculties')
        .then((res) => res.json())
        .then((data) => {
            const formatted = data.faculties.map((faculty) => ({
            label: faculty,
            value: faculty,
            }));
            setFaculties(formatted);
        })
        .catch((err) => {
            console.error("Failed to fetch faculties", err);
        });
    }, []);

    const handleChange = (selected) => {
        setSelectedFaculties(selected || []);
    };
    const toggleExpand = (facultyValue) => {
        setExpandedFaculties(prev => ({
            ...prev,
            [facultyValue]: !prev[facultyValue]
        }));
    };


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
    const handleSearch = useCallback(async (q, locations) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        try {
            let locationParam = '';
            if (locations && locations.length > 0) {
                // สร้าง query หลายอัน: &location=AAA&location=BBB
                locationParam = locations
                    .map(loc => `&location=${encodeURIComponent(loc.value)}`)
                    .join('');
            }

            const response = await fetch(
                `http://localhost:8000/api/search?q=${encodeURIComponent(q)}&neural=${neural}&top=${top}${locationParam}`
            );
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
                handleSearch(query, selectedFaculties);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [query, handleSearch, selectedFaculties]);
    
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
        const timer = setTimeout(() => {
            setTitleOverflowingList(checkOverflow(titleRefs.current));
            setSourceOverflowingList(checkOverflow(sourceRefs.current));
        }, 0); 
        return () => clearTimeout(timer);
    }, [results]);

    /* ------------------------------ File check ------------------------------- */
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedItem) return;

        const originalLocation = selectedItem.payload.location;
        const baseUrl = "http://localhost:9000/document/";

        const checkFile = async () => {
            setLoading(true);
            setError(null);
            setFileUrl(null);

            const location = selectedItem.payload.location;
            const baseUrl = "http://localhost:9000/document/";

            // สร้างชื่อใหม่โดยแทรก "." ก่อน ".pdf"
            let altLocation = location;
            if (location.endsWith(".pdf")) {
                const dotIndex = location.lastIndexOf(".pdf");
                altLocation = location.slice(0, dotIndex) + "." + location.slice(dotIndex); // => ..pdf
            }

            const tryUrls = [
                `${baseUrl}${location}`,      // ปกติ
                `${baseUrl}${altLocation}`,   // ..pdf
            ];

            for (const url of tryUrls) {
                try {
                    const res = await fetch(url, { method: "HEAD" });
                    if (res.ok) {
                        setFileUrl(url);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    // do nothing
                }
            }

            setLoading(false);
            setError("ไม่พบไฟล์ PDF หรือไม่สามารถโหลดได้");
        };

        checkFile();
    }, [selectedItem]);

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
                        <span style={{ marginLeft: "1rem"}}>Top: </span>
                        <input
                            id="top-input"
                            type="number"
                            min="1"
                            max="1000"
                            defaultValue={top}
                            onKeyDown={handleKeyDown}
                            style={{ width: '60px', marginLeft: '8px' }}
                        />
                        <div className="faculty-select">
                            <ReactMultiSelectCheckboxes
                                options={faculties}
                                value={selectedFaculties}
                                onChange={handleChange}
                                placeholderButtonLabel="Select Faculty"
                            />
                        </div>
                    </div>
                    <div className="hidden-scrollbar" style={{ maxHeight: "100rem", overflowY: "auto", marginLeft: "7rem", width: "90%", marginTop: "1rem", marginRight: "3rem" }}>
                        {selectedFaculties.map((faculty) => {
                        // หาชื่อ subtopic (location index 2) ที่อยู่ภายใต้ faculty นี้
                        const uniqueSubtopics = new Set();
                        results.forEach(item => {
                            const locationParts = item.payload.location.split('/');
                            if (locationParts[1] === faculty.value) {
                            uniqueSubtopics.add(locationParts[2]);
                            }
                        });

                        const count = uniqueSubtopics.size;

                        return (
                            <div key={faculty.value}>
                            {/* Topic หลัก */}
                            <div
                                style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}
                                onClick={() => toggleExpand(faculty.value)}
                            >
                                <span style={{ marginRight: "0.5rem", color: "rgb(212 89 89)", width: "1rem" }}>
                                {expandedFaculties[faculty.value] ? '▼' : '▶'}
                                </span>
                                <span style={{ color: "rgb(212 89 89)", fontWeight: "bold" }}>
                                {faculty.label} ({count})
                                </span>
                            </div>

                            {/* แสดง subtopic เป็น span เมื่อ topic ขยาย */}
                            {expandedFaculties[faculty.value] && (
                                <div style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                                {[...uniqueSubtopics].map((subtopic) => {
                                    // หารายการที่อยู่ใน subtopic นี้
                                    const filteredItems = results.filter(item => {
                                    const parts = item.payload.location.split('/');
                                    return parts[1] === faculty.value && parts[2] === subtopic;


                                    });

                                    return (
                                    <div key={subtopic} style={{ marginBottom: "0.3rem" }}>
                                        <span
                                        onClick={() => toggleExpand(`${faculty.value}-${subtopic}`)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            color: "rgb(174 66 66)",  // subtopic 
                                            fontWeight: "bold",
                                            userSelect: "none",
                                            gap: "0.3rem"
                                        }}
                                        >
                                        <span style={{ color: "rgb(174 66 66)", width: "1rem" }}>
                                            {expandedFaculties[`${faculty.value}-${subtopic}`] ? '▼' : '▶'}
                                        </span>
                                        <span>
                                            {subtopic} ({filteredItems.length})
                                        </span>
                                        </span>

                                        {/* แสดงรายการ items เมื่อ subtopic ขยาย */}
                                        {expandedFaculties[`${faculty.value}-${subtopic}`] && (
                                        <ul style={{ marginLeft: "1.8rem", marginTop: "0.3rem" }}>
                                            {filteredItems.map((item, index) => {
                                            const isTarget = ['น.บ.กฎหมายธุรกิจ(นานาชาติ-ปรับปรุง66)(ผ่านกมอ.P-16032024).pdf', 'หลักสูตรปรับปรุง2566(CVS)_แก้ไขPLO_01-06-2023-edit21-8-66.pdf', 'ร่างหลักสูตรปรับปรุง66สาขาเทคโนโลยีเพื่อการพัฒนายั่งยืนV3.pdf'].includes(item.payload.file_name);
                                            const specialPath = "2. งานหลักสูตรนานาชาติและหลักสูตรแนวใหม่/วิทยาลัยสหวิทยาการ/วท.บ. (วิทยาศาสตร์และนวัตกรรมข้อมูล) (หลักสูตรพหุวิทยาการ)/Final_หลักสูตรวท.บ.(วิทยาศาสตร์และนวัตกรรมข้อมูล)(พหุ)(ปป.66).pdf";
                                            let fileLocation = item.payload.location;
                                            if (fileLocation === specialPath) {
                                                // ดึงชื่อไฟล์จริง ๆ ออกมา (ตัด path ด้านหน้าออก)
                                                // const fileNameOnly = fileLocation.split('/').pop();
                                                // เปลี่ยนชื่อไฟล์ตามที่ต้องการ
                                                fileLocation = fileLocation.replace('.66).pdf', '..pdf');
                                            } else if (isTarget) {
                                                // กรณีอื่น ๆ ที่ใช้เงื่อนไข isTarget
                                                fileLocation = fileLocation.replace('.pdf', '..pdf');
                                            }
                                            return (
                                                <li
                                                    key={index}
                                                    onClick={() => handleExpandClick(item)}
                                                    className={`result-item ${selectedItem === item ? 'expanded' : ''}`}
                                                    style={{ cursor: "pointer", marginBottom: "0.3rem" }}
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
                                                            <a
                                                                href={`http://localhost:9000/document/${fileLocation}#page=${item.payload.page}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {`http://localhost:9000/document/${fileLocation}#page=${item.payload.page}`}
                                                            </a>
                                                        </span>
                                                        </span>
                                                    </span>
                                                    <span className="divider g s2"></span>
                                                    <span className="content g s3">
                                                        <span>Page {item.payload.page}</span>
                                                        <span style={{ color: "#CB3737", fontWeight: "400", fontSize: "0.8rem" }}>
                                                        (Score: {typeof item.score === 'number' ? item.score.toFixed(2) : item.score})
                                                        </span>
                                                    </span>

                                                    {selectedItem === item && (
                                                        <div className="g s5 detail-content">
                                                        {/* Detail Content */}
                                                        <div className="detail-item-row1">
                                                            <div className="detail-item" style={{ display: "flex", alignItems: "center" }}>
                                                            <strong>Modified By:</strong>
                                                            <img src={item.payload.modified_profile} onError={(e) => (e.target.src = "/default-profile.png")} alt="Modified" className="profile-image" />
                                                            <a href={`mailto:${item.payload.modified_by_email}`}>{item.payload.modified_by_name}</a>
                                                            </div>
                                                            <div className="detail-item">
                                                            <strong style={{ marginRight: "0.3rem" }}>Modified Date:</strong> {new Date(item.payload.created_date).toLocaleString('th-TH', {hour12: false})}
                                                            </div>
                                                        </div>
                                                        <div className="detail-item-row2">
                                                            <div className="detail-item" style={{ display: "flex", alignItems: "center" }}>
                                                            <strong style={{ marginRight: "0.8rem" }}>Author By:</strong>
                                                            <img src={item.payload.author_profile} onError={(e) => (e.target.src = "/default-profile.png")} alt="Author" className="profile-image" />
                                                            <a href={`mailto:${item.payload.author_email}`}>{item.payload.author_name}</a>
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
                                            );
                                            })}
                                        </ul>
                                        )}
                                    </div>
                                    );
                                })}
                                </div>
                            )}
                            </div>
                        );
                        })}

                    </div>
                </div>

                {/* Right Panel: PDF Viewer */}
                {selectedItem ? (
                    <div className="right-pane" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {loading ? (
                            <p>Loading...</p>
                        ) : fileUrl ? (
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.js">
                                <Viewer
                                    fileUrl={fileUrl}
                                    plugins={[defaultLayoutPluginInstance, searchPluginInstance, getFilePluginInstance]}
                                    defaultScale={1}
                                    initialPage={selectedItem.payload.page - 1}
                                />
                            </Worker>
                        ) : (
                            <p>{error}</p>
                        )}
                    </div>
                ) : (
                    <div className="right-pane" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <p>Click on an item to see details here</p>
                    </div>
                )}
            </SplitPane>
        </SplitPane>
    );
};

export default App;
