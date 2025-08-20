#!/usr/bin/env python3
"""
Example usage of the WhatsApp Bulk Messenger
"""

from whatsapp_bulk_messenger import WhatsAppBulkMessenger

def example_simple_messages():
    """Example with simple text messages"""
    messages = [
        {
            "group": "Sales Team",
            "message": "Q4 targets have been updated. Please review your individual goals in the dashboard.",
            "delay": 5
        },
        {
            "group": "Marketing Team",
            "message": "New product launch campaign approved! Meeting tomorrow at 2 PM to discuss execution.",
            "delay": 8
        },
        {
            "group": "Support Team",
            "message": "Weekend support rotation schedule is now available. Check the shared calendar.",
            "delay": 10
        }
    ]
    
    messenger = WhatsAppBulkMessenger(log_level="INFO")
    results = messenger.send_bulk_messages(messages, default_delay=7)
    
    # Save and print results
    results_file = messenger.save_results(results)
    print(f"Results saved to: {results_file}")
    return results

def example_with_media():
    """Example with media messages"""
    messages = [
        {
            "group": "Development Team",
            "message": "New coding standards document attached. Please review before next sprint.",
            "media_file": "/path/to/coding_standards.pdf",
            "delay": 10
        },
        {
            "group": "Design Team",
            "message": "Brand guidelines updated with new logo variations.",
            "media_file": "/path/to/brand_guidelines.pdf",
            "delay": 15
        }
    ]
    
    messenger = WhatsAppBulkMessenger(log_level="DEBUG")
    results = messenger.send_bulk_messages(messages, default_delay=12)
    return results

def example_mixed_messages():
    """Example with mixed message types and varying delays"""
    messages = [
        {
            "group": "All Staff",
            "message": "Company all-hands meeting scheduled for Friday at 10 AM. Agenda will be shared tomorrow.",
            "delay": 3
        },
        {
            "group": "HR Team",
            "message": "Updated employee handbook attached. Please review policy changes highlighted in red.",
            "media_file": "/path/to/employee_handbook_v2.pdf",
            "delay": 20
        },
        {
            "group": "Finance Team", 
            "message": "Monthly expense reports are due by EOD Friday. Use the new template for submissions.",
            "delay": 5
        },
        {
            "group": "Operations Team",
            "message": "New supplier contracts need review. Priority items marked in the shared spreadsheet.",
            "delay": 15
        }
    ]
    
    messenger = WhatsAppBulkMessenger(log_level="INFO")
    
    # Custom configuration example
    print("Starting mixed message campaign...")
    results = messenger.send_bulk_messages(messages, default_delay=10)
    
    # Print summary
    print(f"\n📊 Campaign Summary:")
    print(f"Total: {results['sent_successfully'] + results['failed']} messages")
    print(f"✅ Sent: {results['sent_successfully']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"⏱️ Duration: {results['duration_seconds']:.1f}s")
    
    return results

def example_error_handling():
    """Example demonstrating error handling"""
    # Messages with potential issues
    messages = [
        {
            "group": "Valid Group",
            "message": "This should work fine.",
            "delay": 5
        },
        {
            "group": "Nonexistent Group",
            "message": "This might fail due to invalid group.",
            "delay": 5
        },
        {
            "group": "Another Group",
            "message": "Message with missing media file.",
            "media_file": "/nonexistent/file.pdf",
            "delay": 5
        }
    ]
    
    messenger = WhatsAppBulkMessenger(log_level="DEBUG")
    results = messenger.send_bulk_messages(messages)
    
    # Show detailed results
    print("\n📋 Detailed Results:")
    for result in results['results']:
        status_emoji = "✅" if result['status'] == 'sent' else "❌"
        print(f"{status_emoji} {result['group']}: {result['status']}")
    
    return results

if __name__ == "__main__":
    print("🚀 WhatsApp Bulk Messenger Examples")
    print("=" * 50)
    
    # Run different examples
    print("\n1. Simple text messages:")
    example_simple_messages()
    
    print("\n2. Mixed message types:")
    example_mixed_messages()
    
    print("\n3. Error handling demonstration:")
    example_error_handling()
    
    print("\n✅ Examples completed!")