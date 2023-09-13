import { processSeriesResults, seriesInStudy } from "@/utils/DicomWebDataSource/qido";
import { useEffect, useState } from "react";
import { api } from "dicomweb-client";
import dcmjs from "dcmjs";
import { adaptersSR } from "@cornerstonejs/adapters";
import addMeasurement from "@/utils/cornerstone-dicom-sr/src/utils/addMeasurement";

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

export default function Annotations() {
    const studyInstanceUID = "1.400.20.81.610.0002598612943543"

    const [annotations, setAnnotations] = useState([])
    const [client, setClient] = useState(null)

    useEffect(() => { 
        const apiClient = new api.DICOMwebClient({
           url: "http://localhost/orthanc/dicom-web",
        })
        setClient(apiClient);
    }, [])

    useEffect(() => {
       
        const getAnntotationsInStudy = async (client) => {
            const result = await seriesInStudy(client, studyInstanceUID);
            const series = processSeriesResults(result);
            const annotations = series.filter((item) => item.modality === "SR");
            setAnnotations(annotations)
        };

        client && getAnntotationsInStudy(client)
    
    }, [client])
    
  const parseCoordinates = (instance) => { 
      console.log('instance', instance)
        const { ContentSequence } = instance;
        const measurements = _getMeasurements(ContentSequence)
        const imageIds = [
          "wadors:http://localhost/orthanc/dicom-web/studies/1.400.20.81.610.0002598612943543/series/1.3.46.670589.30.1.6.1.1625523293.1622603492578.3/instances/1.3.46.670589.30.1.6.1.1625523293.1622603492578.2/frames/1",
        ];
        measurements.map(measurement =>
            addMeasurement(measurement, imageIds[0]))
    }

    const loadAnnotations = async (client, series) => {
        const instance = {
          studyInstanceUID: series.studyInstanceUid,
          seriesInstanceUID: series.seriesInstanceUid,
        };
        client.retrieveSeries(instance).then((dataSet) => {
            const dicomData = dcmjs.data.DicomMessage.readFile(dataSet[0]);
            const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
                dicomData.dict
            );
            parseCoordinates(dataset)
          
        });

      
    }
    const handleClick = (e,series) => { 
        e.preventDefault()
        loadAnnotations(client, series)
     
    }
    return (
      <div className="ml-10">
            {annotations.map((item,index) => { 
                return (
                  <div
                    className="border border-cyan-600 p-2 w-20 hover:bg-cyan-600 hover:text-white cursor-pointer"
                    key={index}
                    onClick={(e) => handleClick(e, item)}
                  >
                    {item.description}
                  </div>
                );
            })}
      </div>

  )
}

const CodeNameCodeSequenceValues = {
  ImagingMeasurementReport: "126000",
  ImageLibrary: "111028",
  ImagingMeasurements: "126010",
  MeasurementGroup: "125007",
  ImageLibraryGroup: "126200",
  TrackingUniqueIdentifier: "112040",
  TrackingIdentifier: "112039",
  Finding: "121071",
  FindingSite: "G-C0E3", // SRT
  CornerstoneFreeText: Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT, //
};

const CodingSchemeDesignators = {
  SRT: "SRT",
  CornerstoneCodeSchemes: [
    Cornerstone3DCodeScheme.CodingSchemeDesignator,
    "CST4",
  ],
};

const RELATIONSHIP_TYPE = {
  INFERRED_FROM: "INFERRED FROM",
  CONTAINS: "CONTAINS",
};

const CORNERSTONE_FREETEXT_CODE_VALUE = "CORNERSTONEFREETEXT";

function _getSequenceAsArray(sequence) {
  if (!sequence) return [];
  return Array.isArray(sequence) ? sequence : [sequence];
}


function _getMergedContentSequencesByTrackingUniqueIdentifiers(
  MeasurementGroups
) {
  const mergedContentSequencesByTrackingUniqueIdentifiers = {};

  MeasurementGroups.forEach((MeasurementGroup) => {
    const ContentSequence = _getSequenceAsArray(
      MeasurementGroup.ContentSequence
    );

    const TrackingUniqueIdentifierItem = ContentSequence.find(
      (item) =>
        item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.TrackingUniqueIdentifier
    );

    if (!TrackingUniqueIdentifierItem) {
      console.warn(
        "No Tracking Unique Identifier, skipping ambiguous measurement."
      );
    }

    const trackingUniqueIdentifier = TrackingUniqueIdentifierItem.UID;

    if (
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] === undefined
    ) {
      // Add the full ContentSequence
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] = [...ContentSequence];
    } else {
      // Add the ContentSequence minus the tracking identifier, as we have this
      // Information in the merged ContentSequence anyway.
      ContentSequence.forEach((item) => {
        if (
          item.ConceptNameCodeSequence.CodeValue !==
          CodeNameCodeSequenceValues.TrackingUniqueIdentifier
        ) {
          mergedContentSequencesByTrackingUniqueIdentifiers[
            trackingUniqueIdentifier
          ].push(item);
        }
      });
    }
  });

  return mergedContentSequencesByTrackingUniqueIdentifiers;
}

function _processMeasurement(mergedContentSequence) {
  if (
    mergedContentSequence.some(
      (group) => group.ValueType === "SCOORD" || group.ValueType === "SCOORD3D"
    )
  ) {
    return _processTID1410Measurement(mergedContentSequence);
  }

  return _processNonGeometricallyDefinedMeasurement(mergedContentSequence);
}

function _processTID1410Measurement(mergedContentSequence) {
  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D

  const graphicItem = mergedContentSequence.find(
    (group) => group.ValueType === "SCOORD"
  );

  const UIDREFContentItem = mergedContentSequence.find(
    (group) => group.ValueType === "UIDREF"
  );

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  if (!graphicItem) {
    console.warn(
      `graphic ValueType ${graphicItem.ValueType} not currently supported, skipping annotation.`
    );
    return;
  }

  const NUMContentItems = mergedContentSequence.filter(
    (group) => group.ValueType === "NUM"
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [_getCoordsFromSCOORDOrSCOORD3D(graphicItem)],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  NUMContentItems.forEach((item) => {
    const { ConceptNameCodeSequence, MeasuredValueSequence } = item;

    if (MeasuredValueSequence) {
      measurement.labels.push(
        _getLabelFromMeasuredValueSequence(
          ConceptNameCodeSequence,
          MeasuredValueSequence
        )
      );
    }
  });

  return measurement;
}

function _processNonGeometricallyDefinedMeasurement(mergedContentSequence) {
  const NUMContentItems = mergedContentSequence.filter(
    (group) => group.ValueType === "NUM"
  );

  const UIDREFContentItem = mergedContentSequence.find(
    (group) => group.ValueType === "UIDREF"
  );

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const finding = mergedContentSequence.find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Finding
  );

  const findingSites = mergedContentSequence.filter(
    (item) =>
      item.ConceptNameCodeSequence.CodingSchemeDesignator ===
        CodingSchemeDesignators.SRT &&
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.FindingSite
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  if (
    finding &&
    CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
      finding.ConceptCodeSequence.CodingSchemeDesignator
    ) &&
    finding.ConceptCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.CornerstoneFreeText
  ) {
    measurement.labels.push({
      label: CORNERSTONE_FREETEXT_CODE_VALUE,
      value: finding.ConceptCodeSequence.CodeMeaning,
    });
  }

  // TODO -> Eventually hopefully support SNOMED or some proper code library, just free text for now.
  if (findingSites.length) {
    const cornerstoneFreeTextFindingSite = findingSites.find(
      (FindingSite) =>
        CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
          FindingSite.ConceptCodeSequence.CodingSchemeDesignator
        ) &&
        FindingSite.ConceptCodeSequence.CodeValue ===
          CodeNameCodeSequenceValues.CornerstoneFreeText
    );

    if (cornerstoneFreeTextFindingSite) {
      measurement.labels.push({
        label: CORNERSTONE_FREETEXT_CODE_VALUE,
        value: cornerstoneFreeTextFindingSite.ConceptCodeSequence.CodeMeaning,
      });
    }
  }

  NUMContentItems.forEach((item) => {
    const { ConceptNameCodeSequence, ContentSequence, MeasuredValueSequence } =
      item;

    const { ValueType } = ContentSequence;

    if (!ValueType === "SCOORD") {
      console.warn(
        `Graphic ${ValueType} not currently supported, skipping annotation.`
      );

      return;
    }

    const coords = _getCoordsFromSCOORDOrSCOORD3D(ContentSequence);

    if (coords) {
      measurement.coords.push(coords);
    }

    if (MeasuredValueSequence) {
      measurement.labels.push(
        _getLabelFromMeasuredValueSequence(
          ConceptNameCodeSequence,
          MeasuredValueSequence
        )
      );
    }
  });

  return measurement;
}
function _getCoordsFromSCOORDOrSCOORD3D(item) {
  const { ValueType, RelationshipType, GraphicType, GraphicData } = item;

  if (
    !(
      RelationshipType == RELATIONSHIP_TYPE.INFERRED_FROM ||
      RelationshipType == RELATIONSHIP_TYPE.CONTAINS
    )
  ) {
    console.warn(
      `Relationshiptype === ${RelationshipType}. Cannot deal with NON TID-1400 SCOORD group with RelationshipType !== "INFERRED FROM" or "CONTAINS"`
    );

    return;
  }

  const coords = { ValueType, GraphicType, GraphicData };

  // ContentSequence has length of 1 as RelationshipType === 'INFERRED FROM'
  if (ValueType === "SCOORD") {
    const { ReferencedSOPSequence } = item.ContentSequence;

    coords.ReferencedSOPSequence = ReferencedSOPSequence;
  } else if (ValueType === "SCOORD3D") {
    const { ReferencedFrameOfReferenceSequence } = item.ContentSequence;

    coords.ReferencedFrameOfReferenceSequence =
      ReferencedFrameOfReferenceSequence;
  }

  return coords;
}

function _getLabelFromMeasuredValueSequence(
  ConceptNameCodeSequence,
  MeasuredValueSequence
) {
  const { CodeMeaning } = ConceptNameCodeSequence;
  const { NumericValue, MeasurementUnitsCodeSequence } = MeasuredValueSequence;
  const { CodeValue } = MeasurementUnitsCodeSequence;

  const formatedNumericValue = NumericValue
    ? Number(NumericValue).toFixed(2)
    : "";

  return {
    label: CodeMeaning,
    value: `${formatedNumericValue} ${CodeValue}`,
  }; // E.g. Long Axis: 31.0 mm
}

function _getReferencedImagesList(ImagingMeasurementReportContentSequence) {
  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibrary
  );

  const ImageLibraryGroup = _getSequenceAsArray(
    ImageLibrary.ContentSequence
  ).find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibraryGroup
  );

  const referencedImages = [];

  _getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach((item) => {
    const { ReferencedSOPSequence } = item;
    if (!ReferencedSOPSequence) return;
    for (const ref of _getSequenceAsArray(ReferencedSOPSequence)) {
      if (ref.ReferencedSOPClassUID) {
        const { ReferencedSOPClassUID, ReferencedSOPInstanceUID } = ref;

        referencedImages.push({
          ReferencedSOPClassUID,
          ReferencedSOPInstanceUID,
        });
      }
    }
  });

  return referencedImages;
}

function _getMeasurements(ImagingMeasurementReportContentSequence) {
  const ImagingMeasurements = ImagingMeasurementReportContentSequence.find(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImagingMeasurements
  );

  const MeasurementGroups = _getSequenceAsArray(
    ImagingMeasurements.ContentSequence
  ).filter(
    (item) =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.MeasurementGroup
    );
  const mergedContentSequencesByTrackingUniqueIdentifiers =
    _getMergedContentSequencesByTrackingUniqueIdentifiers(MeasurementGroups);
  const measurements = [];

  Object.keys(mergedContentSequencesByTrackingUniqueIdentifiers).forEach(
    (trackingUniqueIdentifier) => {
      const mergedContentSequence =
        mergedContentSequencesByTrackingUniqueIdentifiers[
          trackingUniqueIdentifier
        ];

      const measurement = _processMeasurement(mergedContentSequence);

      if (measurement) {
        measurements.push(measurement);
      }
    }
  );

 return measurements;
}