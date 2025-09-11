#!/bin/bash

# This script creates a macOS Shortcut for voice-to-text transcription
echo "Creating macOS Shortcut for voice-to-text..."

# Create a shortcut using the native Shortcuts app
cat << 'EOF' > /tmp/voice-to-text.shortcut
{
  "WFWorkflowMinimumClientVersionString" : "900",
  "WFWorkflowMinimumClientVersion" : 900,
  "WFWorkflowIcon" : {
    "WFWorkflowIconStartColor" : 2846468607,
    "WFWorkflowIconGlyphNumber" : 61440
  },
  "WFWorkflowClientVersion" : "2605.0.5",
  "WFWorkflowOutputContentItemClasses" : [
    "WFStringContentItem"
  ],
  "WFWorkflowHasOutputFallback" : false,
  "WFWorkflowActions" : [
    {
      "WFWorkflowActionIdentifier" : "is.workflow.actions.dictatetext",
      "WFWorkflowActionParameters" : {
        "WFSpeechLanguage" : "en-US"
      }
    },
    {
      "WFWorkflowActionIdentifier" : "is.workflow.actions.setclipboard",
      "WFWorkflowActionParameters" : {
        "WFClipboardText" : {
          "Value" : {
            "string" : "￼",
            "attachmentsByRange" : {
              "{0, 1}" : {
                "OutputUUID" : "previous-action-uuid",
                "Type" : "ActionOutput",
                "OutputName" : "Dictated Text"
              }
            }
          },
          "WFSerializationType" : "WFTextTokenString"
        }
      }
    }
  ],
  "WFWorkflowInputContentItemClasses" : [
    "WFAppContentItem",
    "WFAppStoreAppContentItem",
    "WFArticleContentItem",
    "WFContactContentItem",
    "WFDateContentItem",
    "WFEmailAddressContentItem",
    "WFGenericFileContentItem",
    "WFImageContentItem",
    "WFiTunesProductContentItem",
    "WFLocationContentItem",
    "WFDCMapsLinkContentItem",
    "WFAVAssetContentItem",
    "WFPDFContentItem",
    "WFPhoneNumberContentItem",
    "WFRichTextContentItem",
    "WFSafariWebPageContentItem",
    "WFStringContentItem",
    "WFURLContentItem"
  ],
  "WFWorkflowImportQuestions" : [

  ],
  "WFQuickActionSurfaces" : [

  ],
  "WFWorkflowTypes" : [

  ],
  "WFWorkflowHasShortcutInputVariables" : false
}
EOF

echo "Shortcut definition created. Now creating the simple vtt command..."
echo "Note: You may need to create the shortcut manually in the Shortcuts app for full integration."